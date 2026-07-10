import {
  GENERIC_MODULE_TYPE,
  type ModuleCatalogConfig,
  type ModuleCatalogConfigOptions,
  type ModuleCatalogModuleOption
} from '$lib/schemas/module-catalog'
import { SvelteMap, SvelteSet } from 'svelte/reactivity'

export interface GenericOccurrence {
  id: number
  semester: number
  count: number
}

export interface StudyPlanSectionDraft {
  id: number
  headline: string
  untilSemester: number
}

export function isGenericModule(module: ModuleCatalogModuleOption): boolean {
  return module.moduleType === GENERIC_MODULE_TYPE
}

/** Semester the study plan uses when no explicit selection is made (smallest recommendation). */
export function defaultSemester(module: ModuleCatalogModuleOption): number | undefined {
  return module.recommendedSemesters.length > 0
    ? Math.min(...module.recommendedSemesters)
    : undefined
}

/**
 * Holds the user decisions that deviate from the backend defaults. An untouched state
 * produces an empty `ModuleCatalogConfig`, which means "use the backend defaults".
 */
export class CatalogConfig {
  readonly options: ModuleCatalogConfigOptions

  /** Modules removed from catalog and study plan. */
  readonly excludedModules = new SvelteSet<string>()
  /** Excluded elective options, keyed `${genericModuleId}|${optionModuleId}`. */
  readonly excludedElectiveOptions = new SvelteSet<string>()
  /** Explicit study-plan semester per (mandatory) module. */
  readonly semesterSelections = new SvelteMap<string, number>()
  /** Study-plan placements per generic module, replacing the default single occurrence. */
  readonly genericOccurrences = new SvelteMap<string, GenericOccurrence[]>()
  /** Manual study-plan sections (only allowed for POs without specializations). */
  sections = $state<StudyPlanSectionDraft[]>([])

  /** Modules the backend excludes by default; the config cannot re-include them. */
  readonly #defaultExcluded: ReadonlySet<string>

  #nextSectionId = 0
  #nextOccurrenceId = 0

  constructor(options: ModuleCatalogConfigOptions) {
    this.options = options
    this.#defaultExcluded = new SvelteSet(
      options.modules.filter((module) => !module.defaultIncluded).map((module) => module.id)
    )
    for (const moduleId of this.#defaultExcluded) {
      this.excludedModules.add(moduleId)
    }
  }

  // --- module selection ---

  isModuleExcluded(moduleId: string): boolean {
    return this.excludedModules.has(moduleId)
  }

  isModuleExcludedByDefault(moduleId: string): boolean {
    return this.#defaultExcluded.has(moduleId)
  }

  setModuleIncluded(moduleId: string, included: boolean) {
    if (this.#defaultExcluded.has(moduleId)) {
      return
    }
    if (included) {
      this.excludedModules.delete(moduleId)
    } else {
      this.excludedModules.add(moduleId)
      // the backend rejects study-plan overrides that reference excluded modules
      this.semesterSelections.delete(moduleId)
      this.genericOccurrences.delete(moduleId)
    }
  }

  // --- elective options ---

  #electiveKey(genericModuleId: string, optionModuleId: string): string {
    return `${genericModuleId}|${optionModuleId}`
  }

  isElectiveOptionIncluded(genericModuleId: string, optionModuleId: string): boolean {
    return !this.excludedElectiveOptions.has(this.#electiveKey(genericModuleId, optionModuleId))
  }

  setElectiveOptionIncluded(genericModuleId: string, optionModuleId: string, included: boolean) {
    const key = this.#electiveKey(genericModuleId, optionModuleId)
    if (included) {
      this.excludedElectiveOptions.delete(key)
    } else {
      this.excludedElectiveOptions.add(key)
    }
  }

  /** Elective exclusions that still have an effect (neither side is globally excluded). */
  get effectiveElectiveExclusions(): { genericModuleId: string; optionModuleId: string }[] {
    const result: { genericModuleId: string; optionModuleId: string }[] = []
    for (const key of this.excludedElectiveOptions) {
      const [genericModuleId, optionModuleId] = key.split('|')
      if (this.excludedModules.has(genericModuleId) || this.excludedModules.has(optionModuleId)) {
        continue
      }
      result.push({ genericModuleId, optionModuleId })
    }
    return result
  }

  // --- study plan: semester selections ---

  selectedSemester(moduleId: string): number | undefined {
    return this.semesterSelections.get(moduleId)
  }

  setSelectedSemester(moduleId: string, semester: number | undefined) {
    if (semester === undefined) {
      this.semesterSelections.delete(moduleId)
    } else {
      this.semesterSelections.set(moduleId, semester)
    }
  }

  // --- study plan: generic occurrences ---

  occurrencesOf(moduleId: string): GenericOccurrence[] {
    return this.genericOccurrences.get(moduleId) ?? []
  }

  addOccurrence(module: ModuleCatalogModuleOption) {
    const semester = defaultSemester(module)
    if (semester === undefined) {
      return
    }
    const current = this.occurrencesOf(module.id)
    this.genericOccurrences.set(module.id, [
      ...current,
      { id: this.#nextOccurrenceId++, semester, count: 1 }
    ])
  }

  updateOccurrence(moduleId: string, id: number, patch: Partial<Omit<GenericOccurrence, 'id'>>) {
    const next = this.occurrencesOf(moduleId).map((occurrence) =>
      occurrence.id === id ? { ...occurrence, ...patch } : occurrence
    )
    this.genericOccurrences.set(moduleId, next)
  }

  removeOccurrence(moduleId: string, id: number) {
    const next = this.occurrencesOf(moduleId).filter((occurrence) => occurrence.id !== id)
    if (next.length === 0) {
      this.genericOccurrences.delete(moduleId)
    } else {
      this.genericOccurrences.set(moduleId, next)
    }
  }

  // --- study plan: sections ---

  addSection() {
    this.sections.push({ id: this.#nextSectionId++, headline: '', untilSemester: 1 })
  }

  removeSection(id: number) {
    this.sections = this.sections.filter((section) => section.id !== id)
  }

  get completeSections(): StudyPlanSectionDraft[] {
    return this.sections.filter((section) => section.headline.trim().length > 0)
  }

  // --- deviations ---

  get includedModuleCount(): number {
    return this.options.modules.length - this.excludedModules.size
  }

  get excludedModuleCount(): number {
    let count = 0
    for (const moduleId of this.excludedModules) {
      if (!this.#defaultExcluded.has(moduleId)) {
        count += 1
      }
    }
    return count
  }

  get electiveExclusionCount(): number {
    return this.effectiveElectiveExclusions.length
  }

  get semesterOverrideCount(): number {
    return this.semesterSelections.size
  }

  get occurrenceOverrideCount(): number {
    let count = 0
    for (const occurrences of this.genericOccurrences.values()) {
      count += occurrences.length
    }
    return count
  }

  get sectionCount(): number {
    return this.completeSections.length
  }

  get mandatoryTabDeviationCount(): number {
    return this.excludedModuleCount + this.semesterOverrideCount
  }

  get electivesTabDeviationCount(): number {
    return this.electiveExclusionCount
  }

  get studyPlanTabDeviationCount(): number {
    return this.occurrenceOverrideCount + this.sectionCount
  }

  get deviationCount(): number {
    return (
      this.excludedModuleCount +
      this.electiveExclusionCount +
      this.semesterOverrideCount +
      this.occurrenceOverrideCount +
      this.sectionCount
    )
  }

  get isDefault(): boolean {
    return this.deviationCount === 0
  }

  // --- resets ---

  resetModules() {
    this.excludedModules.clear()
    for (const moduleId of this.#defaultExcluded) {
      this.excludedModules.add(moduleId)
    }
  }

  resetElectiveOptions() {
    this.excludedElectiveOptions.clear()
  }

  resetSemesterSelections() {
    this.semesterSelections.clear()
  }

  resetOccurrences() {
    this.genericOccurrences.clear()
  }

  resetSections() {
    this.sections = []
  }

  resetAll() {
    this.resetModules()
    this.resetElectiveOptions()
    this.resetSemesterSelections()
    this.resetOccurrences()
    this.resetSections()
  }

  // --- config assembly ---

  buildConfig(): ModuleCatalogConfig {
    const semesterSelections: ModuleCatalogConfig['studyPlan']['semesterSelections'] = []
    for (const [moduleId, selectedSemester] of this.semesterSelections) {
      if (!this.excludedModules.has(moduleId)) {
        semesterSelections.push({ moduleId, selectedSemester })
      }
    }

    const genericModuleOccurrences: ModuleCatalogConfig['studyPlan']['genericModuleOccurrences'] =
      []
    for (const [moduleId, occurrences] of this.genericOccurrences) {
      if (this.excludedModules.has(moduleId)) {
        continue
      }
      for (const { semester, count } of occurrences) {
        genericModuleOccurrences.push({ moduleId, semester, count })
      }
    }

    const excludedElectiveOptions = this.effectiveElectiveExclusions
    const excludedElectiveOptionKeys = new SvelteSet(
      excludedElectiveOptions.map(({ genericModuleId, optionModuleId }) =>
        this.#electiveKey(genericModuleId, optionModuleId)
      )
    )
    // Send relationships for excluded generic modules, otherwise the backend renders orphaned options.
    for (const group of this.options.genericElectiveGroups) {
      if (!this.excludedModules.has(group.genericModuleId)) {
        continue
      }
      for (const candidate of group.optionCandidates) {
        if (this.excludedModules.has(candidate.moduleId)) {
          continue
        }
        const key = this.#electiveKey(group.genericModuleId, candidate.moduleId)
        if (excludedElectiveOptionKeys.has(key)) {
          continue
        }
        excludedElectiveOptions.push({
          genericModuleId: group.genericModuleId,
          optionModuleId: candidate.moduleId
        })
        excludedElectiveOptionKeys.add(key)
      }
    }

    return {
      moduleSelection: {
        // exclusions the backend applies by default are not part of the config
        excludedModuleIds: [...this.excludedModules].filter(
          (moduleId) => !this.#defaultExcluded.has(moduleId)
        ),
        excludedElectiveOptions
      },
      studyPlan: {
        sections: this.completeSections.map(({ untilSemester, headline }) => ({
          untilSemester,
          headline: headline.trim()
        })),
        semesterSelections,
        genericModuleOccurrences
      }
    }
  }
}
