import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import type { PublishedDocument } from '$lib/schemas/study-program-artifacts'

export const load: PageServerLoad = async ({ fetch }) => {
  // TODO: only fetch for a specific semester
  const res = await fetch(`/api/examLists`)

  if (!res.ok) {
    const err = await res.json()
    throw error(res.status, {
      message: `Prüfungslisten konnten nicht geladen werden: ${err.message}`
    })
  }

  const examLists: PublishedDocument[] = await res.json()

  return { examLists }
}
