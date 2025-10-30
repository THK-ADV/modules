import { error, type RequestHandler } from '@sveltejs/kit'

async function performRequest(
  kind: 'moduleCatalog' | 'moduleCatalog_creation' | 'examList' | 'examLoad',
  sp: string,
  po: string,
  request: Request,
  fetch: typeof globalThis.fetch
): Promise<Response> {
  switch (kind) {
    case 'moduleCatalog': {
      // TODO: this is a temporary solution to preview the module catalog creation
      const body = await request.json()
      return fetch(`/auth-api/moduleCatalogs/${sp}/${po}?preview=true`, {
        headers: {
          Accept: 'application/pdf',
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body
      })
    }
    case 'moduleCatalog_creation': {
      const body = await request.json()
      return fetch(`/auth-api/moduleCatalogs/${sp}/${po}?preview=false`, {
        headers: {
          Accept: 'application/pdf',
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body
      })
    }
    case 'examList':
      return fetch(`/auth-api/examLists/preview/${sp}/${po}`, {
        headers: {
          Accept: 'application/pdf'
        }
      })
    case 'examLoad':
      return fetch(`/auth-api/examLoad/${sp}/${po}?preview=true`)
  }
}

export const POST: RequestHandler = async ({ params, url, fetch, request }) => {
  const { document } = params
  const po = url.searchParams.get('po')
  const sp = url.searchParams.get('studyProgram')
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
    if (!po || !document || !sp) {
      throw error(400, { message: 'Studiengang, PO und Art der Vorschau sind erforderlich' })
    }

    if (
      document !== 'moduleCatalog' &&
      document !== 'examList' &&
      document !== 'moduleCatalog_creation' &&
      document !== 'examLoad'
    ) {
      throw error(400, {
        message:
          "Vorschau muss entweder 'moduleCatalog' oder 'examList' oder 'moduleCatalog_creation' oder 'examLoad' sein"
      })
    }

    const response = await performRequest(document, sp, po, request, fetch)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const message =
        errorData.message || `Fehler beim Erzeugen: ${response.status} ${response.statusText}`
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
