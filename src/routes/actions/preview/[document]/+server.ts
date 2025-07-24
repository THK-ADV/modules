import { error, type RequestHandler } from '@sveltejs/kit'

export const GET: RequestHandler = async ({ params, url, fetch }) => {
  const { document } = params
  const po = url.searchParams.get('po')
  const sp = url.searchParams.get('studyProgram')

  if (!po || !document || !sp) {
    throw error(400, { message: 'Studiengang, PO und Art der Vorschau sind erforderlich' })
  }

  if (document !== 'moduleCatalog' && document !== 'examList') {
    throw error(400, {
      message: "Vorschau muss entweder 'moduleCatalog' oder 'examList' sein"
    })
  }

  const previewType = document === 'moduleCatalog' ? 'moduleCatalogs' : 'examLists'
  const response = await fetch(`/api/${previewType}/preview/${sp}/${po}`, {
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
