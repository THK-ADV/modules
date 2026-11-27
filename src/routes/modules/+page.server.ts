import {
  latestModuleUpdateSchema,
  moduleViewSchema,
  type ModuleType,
  type ModuleView,
  type StudyProgramModuleAssociation
} from '$lib/schemas/module-view'
import { fetchBackendJson } from '$lib/server/backend/http'
import { z } from 'zod/v4'
import type { PageServerLoad } from './$types'

// Shared instances, so the serialized page holds each module type once.
const pm: ModuleType = { id: 'pm', label: 'Pflichtmodul', abbrev: 'PM' }
const wm: ModuleType = { id: 'wm', label: 'Wahlmodul', abbrev: 'WM' }
const pwm: ModuleType = { id: 'pwm', label: 'Als Modul wählbar', abbrev: 'P/WM' }

function getModuleType(studyPrograms: StudyProgramModuleAssociation[]): ModuleType | undefined {
  const mandatory = studyPrograms.some((s) => s.mandatory)
  const elective = studyPrograms.some((s) => !s.mandatory)
  return mandatory ? (elective ? pwm : pm) : elective ? wm : undefined
}

/** Published modules with their module type, and when they last changed (`null` if unknown). */
export const load: PageServerLoad = async ({ fetch }) => {
  const [modules, latestModuleUpdate] = await Promise.all([
    fetchBackendJson(
      fetch,
      '/api/modules?extend=true',
      z.array(moduleViewSchema),
      'Module konnten nicht geladen werden'
    ),
    fetchBackendJson(
      fetch,
      '/api/git/latestModuleUpdate',
      latestModuleUpdateSchema,
      'Letzte Aktualisierung konnte nicht geladen werden'
    ).catch(() => null)
  ])
  return {
    modules: modules.map((m): ModuleView => ({ ...m, moduleType: getModuleType(m.studyProgram) })),
    latestModuleUpdate: latestModuleUpdate && new Date(latestModuleUpdate)
  }
}
