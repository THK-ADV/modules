import {
  artifactActionSchema,
  artifactTargetSchema,
  type ArtifactAction
} from '$lib/schemas/artifact-action'
import { moduleCatalogConfigSchema } from '$lib/schemas/module-catalog'
import { parseRequestJson } from '$lib/server/request'
import { error, type RequestHandler } from '@sveltejs/kit'

async function performRequest(
  action: ArtifactAction,
  po: string,
  request: Request,
  fetch: typeof globalThis.fetch
): Promise<Response> {
  const encodedPo = encodeURIComponent(po)
  let moduleCatalogBody: string | undefined
  if (action === 'moduleCatalog' || action === 'moduleCatalog_creation') {
    const data = await parseRequestJson(
      request,
      moduleCatalogConfigSchema,
      'Ungültige Modulhandbuch-Auswahl'
    )
    moduleCatalogBody = JSON.stringify(data)
  }

  switch (action) {
    case 'moduleCatalog': {
      // TODO: this is a temporary solution to preview the module catalog creation
      return fetch(`/auth-api/moduleCatalogs/${encodedPo}?preview=true`, {
        headers: {
          Accept: 'application/pdf',
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: moduleCatalogBody
      })
    }
    case 'moduleCatalog_creation': {
      return fetch(`/auth-api/moduleCatalogs/${encodedPo}?preview=false`, {
        headers: {
          Accept: 'application/pdf',
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: moduleCatalogBody
      })
    }
    case 'examList':
      return fetch(`/auth-api/examLists/preview/${encodedPo}`, {
        headers: {
          Accept: 'application/pdf'
        }
      })
    case 'examLoad':
      return fetch(`/auth-api/examLoad/${encodedPo}?preview=true`)
  }
}

export const POST: RequestHandler = async ({ params, url, fetch, request }) => {
  const kindResult = artifactActionSchema.safeParse(params.document)
  const queryResult = artifactTargetSchema.safeParse(url.searchParams.get('po'))
  if (!kindResult.success || !queryResult.success) {
    throw error(400, { message: 'PO und Art der Vorschau sind ungültig' })
  }

  const action = kindResult.data
  const po = queryResult.data
  const dryRun = url.searchParams.get('dryRun') === 'true'

  if (dryRun) {
    return new Promise<Response>((resolve) => {
      setTimeout(() => {
        resolve(
          new Response(`[DRY RUN] PDF preview of ${action} generated for ${po}`, {
            status: 200
          })
        )
      }, 5000)
    })
  } else {
    const response = await performRequest(action, po, request, fetch)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unbekannter Latex Fehler' }))
      const message = errorData.message || `Fehler beim Erzeugen: ${JSON.stringify(errorData)}`
      throw error(response.status, { message })
    }

    if (action === 'examLoad') {
      const csv = await response.text()
      return new Response(csv, { headers: response.headers })
    } else {
      const blob = await response.blob()
      return new Response(blob, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${action}-${po}.pdf"`
        }
      })
    }
  }
}
