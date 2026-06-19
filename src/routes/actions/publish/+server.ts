import { examListReleaseRequestSchema } from '$lib/schemas/study-program'
import { parseRequestJson } from '$lib/server/request'
import { error, json, type RequestHandler } from '@sveltejs/kit'

export const PUT: RequestHandler = async ({ request, fetch, url }) => {
  const { semester, date, studyProgram, po } = await parseRequestJson(
    request,
    examListReleaseRequestSchema,
    'Ungültige Daten für die Prüfungslistenfreigabe'
  )
  const dryRun = url.searchParams.get('dryRun') === 'true'

  if (dryRun) {
    return new Promise<Response>((resolve) => {
      setTimeout(() => {
        resolve(
          json(
            {
              message: `[DRY RUN] Published exam list for po ${po} in semester ${semester} at date ${date}`
            },
            { status: 200 }
          )
        )
      }, 1000)
    })
  } else {
    const res = await fetch(`/auth-api/examLists/${studyProgram}/${po}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ semester, date })
    })
    if (!res.ok) {
      const err = await res.json()
      return error(400, {
        message: err.message || `Freigabe der Prüfungsliste fehlgeschlagen`
      })
    }
    return json({ message: 'Prüfungsliste freigegeben' }, { status: 200 })
  }
}
