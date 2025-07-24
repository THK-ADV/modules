import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import type { StudyProgramPrivileges } from '$lib/types/study-program-privileges'

function orderByStudyProgram(lhs: StudyProgramPrivileges, rhs: StudyProgramPrivileges): number {
  return lhs.studyProgram.id.localeCompare(rhs.studyProgram.id)
}

function orderByDegree(lhs: StudyProgramPrivileges, rhs: StudyProgramPrivileges): number {
  return lhs.studyProgram.degree.id.localeCompare(rhs.studyProgram.degree.id)
}

function orderByPO(lhs: StudyProgramPrivileges, rhs: StudyProgramPrivileges): number {
  return lhs.studyProgram.po.version - rhs.studyProgram.po.version
}

export const load: PageServerLoad = async ({ fetch }) => {
  const res = await fetch(`/api/me?newApi=false`)

  if (!res.ok) {
    const err = await res.json()
    const message = `User Privilegien konnten nicht geladen werden: ${err.message}`
    throw error(res.status, { message })
  }

  const json: { privileges: StudyProgramPrivileges[] } = await res.json()
  const privileges = json.privileges.filter((p) => !p.studyProgram.specialization)
  privileges.sort((lhs, rhs) => {
    const byStudyProgram = orderByStudyProgram(lhs, rhs)
    if (byStudyProgram !== 0) return byStudyProgram
    const byDegree = orderByDegree(lhs, rhs)
    if (byDegree !== 0) return byDegree
    return orderByPO(lhs, rhs)
  })
  return { privileges }
}
