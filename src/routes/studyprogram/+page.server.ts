import type { ExamList } from '$lib/types/exam-list'
import type { Semester } from '$lib/types/semester'
import type { StudyProgram } from '$lib/types/study-program'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { SELECTED_TAB_COOKIE_NAME } from './+page.svelte'

export interface StudyProgramMangerInfo {
  studyProgram: StudyProgram
  canPreview: boolean
  canCreate: boolean
  examList?: ExamList
  moduleCatalogIntroLastModified?: Date
}

function orderByStudyProgram(lhs: StudyProgramMangerInfo, rhs: StudyProgramMangerInfo): number {
  return lhs.studyProgram.id.localeCompare(rhs.studyProgram.id)
}

function orderByDegree(lhs: StudyProgramMangerInfo, rhs: StudyProgramMangerInfo): number {
  return lhs.studyProgram.degree.id.localeCompare(rhs.studyProgram.degree.id)
}

function orderByPO(lhs: StudyProgramMangerInfo, rhs: StudyProgramMangerInfo): number {
  return lhs.studyProgram.po.version - rhs.studyProgram.po.version
}

export const load: PageServerLoad = async ({ fetch, depends, cookies }) => {
  depends('preview:studyProgram') // pass this key to the validate function inside a client component to re-run the load function

  const [privilegesRes, semesterRes, examListsRes, moduleCatalogIntrosRes] =
    await Promise.allSettled([
      fetch(`/auth-api/user-privileges`),
      fetch(`/api/examLists/semesters`),
      fetch(`/api/examLists`),
      fetch(`/auth-api/moduleCatalogIntros`)
    ])

  if (privilegesRes.status === 'rejected') {
    const err = await privilegesRes.reason
    const message = `Benutzer Daten konnten nicht geladen werden: ${err.message}`
    throw error(500, { message })
  }

  if (semesterRes.status === 'rejected') {
    const err = await semesterRes.reason
    const message = `Semester konnten nicht geladen werden: ${err.message}`
    throw error(500, { message })
  }

  if (examListsRes.status === 'rejected') {
    const err = await examListsRes.reason
    const message = `Informationen zu Prüfungslisten konnten nicht geladen werden: ${err.message}`
    throw error(500, { message })
  }

  let moduleCatalogIntros: { po: string; lastModified: string }[] | undefined = undefined

  if (moduleCatalogIntrosRes.status === 'fulfilled') {
    moduleCatalogIntros = await moduleCatalogIntrosRes.value.json()
  }

  const semesters: Semester[] = await semesterRes.value.json()

  const examLists: ExamList[] = await examListsRes.value.json()

  const studyProgramMangerInfo: StudyProgramMangerInfo[] = await privilegesRes.value.json()

  for (const info of studyProgramMangerInfo) {
    // we ensure that exam lists contain only the latest version of the po
    info.examList = examLists.find((e) => e.studyProgram.po.id === info.studyProgram.po.id)

    // the same applies for the module catalog introduction
    if (moduleCatalogIntros) {
      const intro = moduleCatalogIntros.find((m) => m.po === info.studyProgram.po.id)
      if (intro) {
        info.moduleCatalogIntroLastModified = new Date(intro.lastModified)
      }
    }
  }

  studyProgramMangerInfo.sort((lhs, rhs) => {
    const byStudyProgram = orderByStudyProgram(lhs, rhs)
    if (byStudyProgram !== 0) return byStudyProgram
    const byDegree = orderByDegree(lhs, rhs)
    if (byDegree !== 0) return byDegree
    return orderByPO(lhs, rhs)
  })

  const selectedTab = cookies.get(SELECTED_TAB_COOKIE_NAME)

  return { studyProgramMangerInfo, semesters, selectedTab }
}
