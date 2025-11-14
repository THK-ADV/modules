import { error, json, type RequestHandler } from '@sveltejs/kit'

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
