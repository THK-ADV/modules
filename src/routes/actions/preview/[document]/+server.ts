import {
  documentPreviewKindSchema,
  documentPreviewQuerySchema,
  moduleCatalogRequestSchema,
  type DocumentPreviewKind
} from '$lib/schemas/study-program'
import { parseRequestJson } from '$lib/server/request'
import { error, type RequestHandler } from '@sveltejs/kit'

async function performRequest(
  kind: DocumentPreviewKind,
  sp: string,
  po: string,
  request: Request,
  fetch: typeof globalThis.fetch
): Promise<Response> {
  const encodedStudyProgram = encodeURIComponent(sp)
  const encodedPo = encodeURIComponent(po)
  let moduleCatalogBody: string | undefined
  if (kind === 'moduleCatalog' || kind === 'moduleCatalog_creation') {
    const data = await parseRequestJson(
      request,
      moduleCatalogRequestSchema,
      'Ungültige Modulhandbuch-Auswahl'
    )
    moduleCatalogBody = JSON.stringify(data)
  }

  switch (kind) {
    case 'moduleCatalog': {
      // TODO: this is a temporary solution to preview the module catalog creation
      return fetch(`/auth-api/moduleCatalogs/${encodedStudyProgram}/${encodedPo}?preview=true`, {
        headers: {
          Accept: 'application/pdf',
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: moduleCatalogBody
      })
    }
    case 'moduleCatalog_creation': {
      return fetch(`/auth-api/moduleCatalogs/${encodedStudyProgram}/${encodedPo}?preview=false`, {
        headers: {
          Accept: 'application/pdf',
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: moduleCatalogBody
      })
    }
    case 'examList':
      return fetch(`/auth-api/examLists/preview/${encodedStudyProgram}/${encodedPo}`, {
        headers: {
          Accept: 'application/pdf'
        }
      })
    case 'examLoad':
      return fetch(`/auth-api/examLoad/${encodedStudyProgram}/${encodedPo}?preview=true`)
  }
}

export const POST: RequestHandler = async ({ params, url, fetch, request }) => {
  const kindResult = documentPreviewKindSchema.safeParse(params.document)
  const queryResult = documentPreviewQuerySchema.safeParse({
    po: url.searchParams.get('po'),
    studyProgram: url.searchParams.get('studyProgram')
  })
  if (!kindResult.success || !queryResult.success) {
    throw error(400, { message: 'Studiengang, PO und Art der Vorschau sind ungültig' })
  }

  const document = kindResult.data
  const { po, studyProgram: sp } = queryResult.data
  const dryRun = url.searchParams.get('dryRun') === 'true'

  if (dryRun) {
    return new Promise<Response>((resolve) => {
      setTimeout(() => {
        resolve(
          new Response(`[DRY RUN] PDF preview of ${document} generated for ${po}`, {
            status: 200
          })
        )
      }, 5000)
    })
  } else {
    const response = await performRequest(document, sp, po, request, fetch)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unbekannter Latex Fehler' }))
      const message = errorData.message || `Fehler beim Erzeugen: ${JSON.stringify(errorData)}`
      throw error(response.status, { message })
    }

    if (document === 'examLoad') {
      const csv = await response.text()
      return new Response(csv, { headers: response.headers })
    } else {
      const blob = await response.blob()
      return new Response(blob, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${document}-${sp}-${po}.pdf"`
        }
      })
    }
  }
}
