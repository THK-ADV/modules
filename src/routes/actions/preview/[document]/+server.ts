import { error, type RequestHandler } from '@sveltejs/kit'

export const GET: RequestHandler = async ({ params, url, fetch }) => {
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
      document !== 'moduleCatalog_creation'
    ) {
      throw error(400, {
        message:
          "Vorschau muss entweder 'moduleCatalog' oder 'examList' oder 'moduleCatalog_creation' sein"
      })
    }

    // TODO: this is a temporary solution to preview the module catalog creation
    if (document === 'moduleCatalog_creation') {
      const response = await fetch(`/auth-api/moduleCatalogs/${sp}/${po}`, {
        headers: {
          Accept: 'application/pdf'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw error(response.status, {
          message:
            errorData.message ||
            `Fehler beim Erzeugen des Modulhandbuchs: ${response.status} ${response.statusText}`
        })
      }

      const blob = await response.blob()
      return new Response(blob, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${document}-${sp}-${po}.pdf"`
        }
      })
    } else {
      const previewType = document === 'moduleCatalog' ? 'moduleCatalogs' : 'examLists'
      const response = await fetch(`/auth-api/${previewType}/preview/${sp}/${po}`, {
        headers: {
          Accept: 'application/pdf'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw error(response.status, {
          message:
            errorData.message ||
            `Fehler beim Erzeugen der Vorschau: ${response.status} ${response.statusText}`
        })
      }

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
