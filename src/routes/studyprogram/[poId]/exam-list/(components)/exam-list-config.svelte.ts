import type { DateRange, ExamListConfig, ExamListModuleOption } from '$lib/schemas/exam-list'
import type { Semester } from '$lib/schemas/semester'
import { TIME_ZONE } from '$lib/formats'
import { today } from '@internationalized/date'
import { SvelteMap, SvelteSet } from 'svelte/reactivity'

/** `null` is the default exam named after the module. */
export type Exam = string | null

/** Why a candidate is not part of the list. */
export type Exclusion = 'generic' | 'manual' | 'phases' | 'exams'

/** List-wide settings, edited as a draft in the settings dialog. */
export type ExamListSettings = Pick<
  ExamListConfig,
  'semester' | 'examPhases' | 'excludeGenericModules' | 'registrationPeriods'
>

const DEFAULT_PHASES: Record<string, string[]> = {
  wise: ['wise_1', 'off_wise', 'off_schedule'],
  sose: ['sose_1', 'sose_2', 'off_sose', 'off_schedule']
}

const EMPTY: DateRange = { start: null, end: null }

/** Default phases of the semester, keeping the generic exclusion of the given settings. */
export const forSemester = (s: ExamListSettings, semester: string): ExamListSettings => ({
  ...s,
  semester,
  examPhases: [...DEFAULT_PHASES[semester.slice(0, 4)]],
  registrationPeriods: {}
})

const key = (...parts: unknown[]) => JSON.stringify(parts)

export const todayInBerlin = () => today(TIME_ZONE).toString()

export const isComplete = (range: DateRange | undefined) => !!range?.start && !!range.end

/**
 * Editable exam list configuration of a PO. It applies the selection rules of the backend to the
 * candidates so that exclusions and missing registration periods show before any request.
 */
export class ExamListState {
  readonly modules: ExamListModuleOption[]

  semester = $state('')
  examPhases = $state<string[]>([])
  excludeGenericModules = $state(true)
  registrationPeriods = $state<Record<string, DateRange>>({})
  readonly excludedModules = new SvelteSet<string>()
  /** Keyed by `key(module, exam)`. */
  readonly excludedExams = new SvelteSet<string>()
  /** Keyed by `key(module, exam, phase)`. */
  readonly overrides = new SvelteMap<string, DateRange>()

  /** Included exams and phases without a complete registration period. */
  readonly missing = $derived.by(() =>
    this.modules.flatMap((m) =>
      this.exclusion(m) || m.isGeneric
        ? []
        : this.exams(m)
            .filter((exam) => this.isExamIncluded(m, exam))
            .flatMap((exam) =>
              this.phases(m)
                .filter((phase) => !isComplete(this.period(m, exam, phase)))
                .map((phase) => ({ module: m, exam, phase }))
            )
    )
  )

  constructor(
    modules: ExamListModuleOption[],
    stored: ExamListConfig | null,
    semesters: Semester[]
  ) {
    this.modules = modules
    if (!stored) {
      const now = todayInBerlin()
      const semester = semesters.find((s) => s.start > now) ?? semesters[semesters.length - 1]
      this.applySettings(forSemester(this.settings(), semester.id))
      return
    }
    this.semester = stored.semester
    this.examPhases = stored.examPhases
    this.excludeGenericModules = stored.excludeGenericModules
    this.registrationPeriods = stored.registrationPeriods
    for (const module of stored.excludedModuleIds) this.excludedModules.add(module)
    for (const { module, exam } of stored.excludedExams) this.excludedExams.add(key(module, exam))
    for (const { module, exam, phase, start, end } of stored.registrationOverrides)
      this.overrides.set(key(module, exam, phase), { start, end })
  }

  settings(): ExamListSettings {
    return $state.snapshot({
      semester: this.semester,
      examPhases: this.examPhases,
      excludeGenericModules: this.excludeGenericModules,
      registrationPeriods: this.registrationPeriods
    })
  }

  /** A semester change empties all overrides, which must then be set again. */
  applySettings(s: ExamListSettings) {
    if (s.semester !== this.semester)
      for (const k of this.overrides.keys()) this.overrides.set(k, EMPTY)
    this.semester = s.semester
    this.examPhases = s.examPhases
    this.excludeGenericModules = s.excludeGenericModules
    this.registrationPeriods = s.registrationPeriods
  }

  /** Modules with the phase and their included exams without override, which use the standard period. */
  phaseUsage(phase: string) {
    const modules = this.modules.filter(
      (m) => !m.isGeneric && !this.excludedModules.has(m.id) && m.examPhases.includes(phase)
    )
    const exams = modules.flatMap((m) =>
      this.exams(m).filter((e) => this.isExamIncluded(m, e) && !this.override(m, e, phase))
    )
    return { modules: modules.length, exams: exams.length }
  }

  exams(m: ExamListModuleOption): Exam[] {
    return m.examNames ?? [null]
  }

  /** Considered phases: the module phases within the filter, for generic modules all except `none`. */
  phases(m: ExamListModuleOption): string[] {
    return m.examPhases.filter((p) => (m.isGeneric ? p !== 'none' : this.examPhases.includes(p)))
  }

  exclusion(m: ExamListModuleOption): Exclusion | undefined {
    if (this.excludeGenericModules && m.isGeneric) return 'generic'
    if (m.isGeneric) return this.excludedModules.has(m.id) ? 'manual' : undefined
    if (this.phases(m).length === 0) return 'phases'
    if (this.excludedModules.has(m.id)) return 'manual'
    if (!this.exams(m).some((exam) => this.isExamIncluded(m, exam))) return 'exams'
  }

  /** Including a module also includes its default exam, which has no switch of its own. */
  setModuleIncluded(m: ExamListModuleOption, included: boolean) {
    if (included) {
      this.excludedModules.delete(m.id)
      this.excludedExams.delete(key(m.id, null))
    } else this.excludedModules.add(m.id)
  }

  isExamIncluded(m: ExamListModuleOption, exam: Exam) {
    return !this.excludedExams.has(key(m.id, exam))
  }

  setExamIncluded(m: ExamListModuleOption, exam: Exam, included: boolean) {
    if (included) this.excludedExams.delete(key(m.id, exam))
    else this.excludedExams.add(key(m.id, exam))
  }

  override(m: ExamListModuleOption, exam: Exam, phase: string): DateRange | undefined {
    return this.overrides.get(key(m.id, exam, phase))
  }

  /** Sets or, with `undefined`, removes the override, so the global period applies again. */
  setOverride(m: ExamListModuleOption, exam: Exam, phase: string, range: DateRange | undefined) {
    if (range) this.overrides.set(key(m.id, exam, phase), range)
    else this.overrides.delete(key(m.id, exam, phase))
  }

  /** Copies the override of one exam to all exams of the module for the same phase. */
  applyToAllExams(m: ExamListModuleOption, exam: Exam, phase: string) {
    const range = this.override(m, exam, phase)
    for (const other of this.exams(m)) this.setOverride(m, other, phase, range)
  }

  isMissing(m: ExamListModuleOption, exam: Exam, phase: string) {
    return this.missing.some((x) => x.module === m && x.exam === exam && x.phase === phase)
  }

  /** Effective registration period: the override, otherwise the global period of the phase. */
  period(m: ExamListModuleOption, exam: Exam, phase: string): DateRange | undefined {
    return this.override(m, exam, phase) ?? this.registrationPeriods[phase]
  }

  /** The release date is only given on publication. */
  toConfig(date: string | null = null): ExamListConfig {
    const parse = (k: string) => JSON.parse(k)
    return {
      semester: this.semester,
      date,
      examPhases: [...this.examPhases],
      excludeGenericModules: this.excludeGenericModules,
      excludedModuleIds: [...this.excludedModules],
      excludedExams: [...this.excludedExams].map(parse).map(([module, exam]) => ({ module, exam })),
      registrationPeriods: $state.snapshot(this.registrationPeriods),
      registrationOverrides: [...this.overrides].map(([k, range]) => {
        const [module, exam, phase] = parse(k)
        return { module, exam, phase, ...range }
      })
    }
  }
}
