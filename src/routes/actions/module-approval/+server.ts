import { error, json, text, type RequestHandler } from '@sveltejs/kit'

export const PUT: RequestHandler = async ({ request, fetch }) => {
  const {
    action,
    comment,
    reviews
  }: {
    action: 'approve' | 'reject'
    comment: string
    reviews: { reviewId: string; role: string; studyProgram: string }[]
  } = await request.json()

  const res = await fetch('/auth-api/moduleReviews', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action,
      comment: comment || null,
      reviews: reviews.map(({ reviewId }) => reviewId)
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
  const res = await fetch(`/auth-api/moduleDrafts/${moduleId}/mrurl`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Fehler beim Abrufen der GitLab URL' }))
    return error(400, { message: err.message })
  }
  // remove quotes from URL
  const gitLabUrl = (await res.text()).slice(1, -1)
  return text(gitLabUrl)
}
