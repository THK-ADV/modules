import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// TODO: check all functions

export const DELETE: RequestHandler = async ({ params, fetch }) => {
  const { moduleId } = params

  console.log('🗑️ DELETE request for moduleId:', moduleId)

  const backendUrl = `/api/moduleDrafts/${moduleId}`
  console.log('🔗 Making request to backend:', backendUrl)

  const response = await fetch(backendUrl, {
    method: 'DELETE'
  })

  console.log('📤 Backend response status:', response.status)
  console.log('📤 Backend response ok:', response.ok)
  console.log('📤 Backend response statusText:', response.statusText)

  if (!response.ok) {
    let errorData
    try {
      errorData = await response.json()
      console.log('❌ Backend error data:', errorData)
    } catch (e) {
      console.log('❌ Could not parse error as JSON, raw response:', await response.text())
      errorData = {}
    }

    throw error(response.status, {
      message:
        errorData.message ||
        `Failed to delete module draft: ${response.status} ${response.statusText}`
    })
  }

  console.log('✅ Delete successful')
  return json({ success: true })
}

export const POST: RequestHandler = async ({ params, request, fetch }) => {
  const { moduleId } = params
  const { action } = await request.json()

  let endpoint: string
  let method = 'POST'

  switch (action) {
    case 'publish':
      endpoint = `/api/moduleDrafts/${moduleId}/publish`
      break
    case 'requestReview':
      endpoint = `/api/moduleDrafts/${moduleId}/request-review`
      break
    case 'cancelReview':
      endpoint = `/api/moduleDrafts/${moduleId}/cancel-review`
      break
    default:
      throw error(400, { message: 'Invalid action' })
  }

  const response = await fetch(endpoint, { method })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw error(response.status, {
      message: errorData.message || `Failed to ${action}`
    })
  }

  return json({ success: true })
}
