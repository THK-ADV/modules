import { moduleReviewActionRequestSchema } from '$lib/schemas/module-actions'
import { parseRequestJson } from '$lib/server/request'
import { error, json, text, type RequestHandler } from '@sveltejs/kit'

export const PUT: RequestHandler = async ({ request, fetch }) => {
  const { action, comment, reviews } = await parseRequestJson(
    request,
    moduleReviewActionRequestSchema,
    'Ungültige Review-Aktion'
  )

  const res = await fetch('/auth-api/moduleReviews', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action,
      comment: comment || null,
      reviews
    })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Modul-Review fehlgeschlagen' }))
    return error(400, {
      message: err.message || `Modul-Review fehlgeschlagen`
    })
  }

  return json({ success: true })
}

// fetch the GitLab URL for the given module ID
export const GET: RequestHandler = async ({ fetch, url }) => {
  const moduleId = url.searchParams.get('moduleId')
  if (!moduleId) {
    return error(400, { message: 'Modul-ID ist erforderlich' })
  }
  const res = await fetch(`/auth-api/moduleDrafts/${encodeURIComponent(moduleId)}/mrurl`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Fehler beim Abrufen der GitLab URL' }))
    return error(400, { message: err.message })
  }
  // remove quotes from URL
  const gitLabUrl = (await res.text()).slice(1, -1)
  return text(gitLabUrl)
}
