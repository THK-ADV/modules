import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import type { ExamList } from '$lib/types/exam-list'

export const load: PageServerLoad = async ({ fetch }) => {
  // TODO: only fetch for a specific semester
  const res = await fetch(`/api/examLists`)

  if (!res.ok) {
    const err = await res.json()
    throw error(res.status, {
      message: `Prüfungslisten konnten nicht geladen werden: ${err.message}`
    })
  }

  const examLists: ExamList[] = await res.json()

  return { examLists }
}
