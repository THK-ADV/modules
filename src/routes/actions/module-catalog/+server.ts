import { error, json, type RequestHandler } from '@sveltejs/kit'

export const POST: RequestHandler = async ({ request, fetch, url }) => {
  const action = url.searchParams.get('action')
  const studyProgramId = url.searchParams.get('studyProgramId')
  const poId = url.searchParams.get('poId')

  if (action !== 'upload') {
    return error(400, { message: 'Ungültige Aktion' })
  }

  if (!studyProgramId || !poId) {
    return error(400, { message: 'studyProgramId und poId sind erforderlich' })
  }

  try {
    const requestInit: RequestInit & { duplex: string } = {
      method: 'POST',
      headers: request.headers,
      body: request.body,
      duplex: 'half'
    }
    const response = await fetch(
      `/auth-api/moduleCatalogIntros/${studyProgramId}/${poId}`,
      requestInit
    )

    if (!response.ok) {
      const err = await response.json()
      return error(response.status, {
        message: err.message || 'Fehler beim Hochladen der Einleitung'
      })
    }

    return json({ success: true }, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return error(500, { message })
  }
}
