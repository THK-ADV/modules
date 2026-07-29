import { error, json, type RequestHandler } from '@sveltejs/kit'

export const POST: RequestHandler = async ({ request, fetch, url }) => {
  const action = url.searchParams.get('action')
  const poId = url.searchParams.get('poId')

  if (action !== 'upload') {
    return error(400, { message: 'Ungültige Aktion' })
  }

  if (!poId) {
    return error(400, { message: 'poId ist erforderlich' })
  }

  const headers = new Headers()
  const contentType = request.headers.get('content-type')
  if (contentType) headers.set('content-type', contentType)
  const body = await request.arrayBuffer()

  const requestInit: RequestInit = {
    method: 'POST',
    headers,
    body
  }
  const response = await fetch(
    `/auth-api/moduleCatalogIntros/${encodeURIComponent(poId)}`,
    requestInit
  )

  if (!response.ok) {
    const err = await response
      .json()
      .catch(() => ({ message: 'Fehler beim Hochladen der Einleitung' }))
    throw error(response.status, {
      message: err.message || 'Fehler beim Hochladen der Einleitung'
    })
  }

  return json({ success: true }, { status: 200 })
}
