<script lang="ts" module>
  import type {
    GenericModuleOption,
    Identity,
    ModuleDetail,
    ModuleShort,
    POMandatory,
    Prerequisite
  } from '$lib/types/module-details'

  function createWorkloadContactHours({ workload }: ModuleDetail) {
    return (
      workload.lecture +
      workload.exercise +
      workload.seminar +
      workload.practical +
      workload.projectSupervision +
      workload.projectWork
    )
  }

  function createDegrees({ poMandatory, poOptional }: ModuleDetail) {
    let label = new Set<string>()
    for (const po of poMandatory) {
      label.add(po.degree)
    }
    for (const po of poOptional) {
      label.add(po.degree)
    }
    const array = Array.from(label)
    array.sort((a, b) => a.localeCompare(b))
    return array
  }

  function createECTSFactors({ poMandatory, poOptional }: ModuleDetail) {
    const factors = new Set<number>()
    for (const po of poMandatory) {
      factors.add(po.poECTSFactor)
    }
    for (const po of poOptional) {
      factors.add(po.poECTSFactor)
    }
    const array = Array.from(factors)
    array.sort((a, b) => a - b)
    return array
  }

  function createStudyPrograms(pos: POMandatory[]) {
    const result: {
      [key: string]: {
        studyProgram: string
        pos: string[]
        poVersions: number[]
        semester: number[]
        specializations: { label: string; abbrev: string }[]
      }[]
    } = {}

    for (const po of pos) {
      const key = po.studyProgramId
      if (key in result) {
        const entries = result[key]
        let updated = false
        for (const entry of entries) {
          const semestersEqual =
            entry.semester.length === po.recommendedSemester.length &&
            entry.semester.every((s) => po.recommendedSemester.includes(s))

          if (semestersEqual) {
            if (!entry.poVersions.includes(po.poVersion)) {
              entry.poVersions.push(po.poVersion)
            }
            if (!entry.pos.includes(po.poId)) {
              entry.pos.push(po.poId)
            }
            if (po.specializationLabel && po.specializationAbbrev) {
              if (!entry.specializations.some(({ label }) => label === po.specializationLabel)) {
                entry.specializations.push({
                  label: po.specializationLabel,
                  abbrev: po.specializationAbbrev
                })
              }
            }
            updated = true
            break
          }
        }
        if (!updated) {
          entries.push({
            studyProgram: po.studyProgramLabel,
            poVersions: [po.poVersion],
            pos: [po.poId],
            semester: po.recommendedSemester,
            specializations:
              po.specializationLabel && po.specializationAbbrev
                ? [
                    {
                      label: po.specializationLabel,
                      abbrev: po.specializationAbbrev
                    }
                  ]
                : []
          })
        }
      } else {
        result[key] = [
          {
            studyProgram: po.studyProgramLabel,
            poVersions: [po.poVersion],
            pos: [po.poId],
            semester: po.recommendedSemester,
            specializations:
              po.specializationLabel && po.specializationAbbrev
                ? [
                    {
                      label: po.specializationLabel,
                      abbrev: po.specializationAbbrev
                    }
                  ]
                : []
          }
        ]
      }
    }
    const array = Object.values(result).flat()
    array.forEach((e) => {
      e.poVersions.sort((a, b) => a - b)
      e.semester.sort((a, b) => a - b)
      e.specializations.sort((a, b) => a.abbrev.localeCompare(b.abbrev))
    })
    array.sort((a, b) => a.studyProgram.localeCompare(b.studyProgram))
    return array
  }

  function createExamPhases({ examPhases }: ModuleDetail) {
    let bothSose = 0
    let bothOffSchedule = 0

    for (const phase of examPhases) {
      if (phase === 'sose_1' || phase === 'sose_2') {
        bothSose++
      }
      if (phase === 'off_wise' || phase === 'off_sose') {
        bothOffSchedule++
      }
    }

    let merged = new Set<string>()

    for (const phase of examPhases) {
      switch (phase) {
        case 'sose_1':
        case 'sose_2':
          if (bothSose === 2) {
            merged.add('sose')
            break
          } else {
            merged.add(phase)
            break
          }
        case 'off_wise':
        case 'off_sose':
          if (bothOffSchedule === 2) {
            merged.add('off_schedule')
            break
          } else {
            merged.add(phase)
            break
          }
        default:
          merged.add(phase)
          break
      }
    }

    const array = Array.from(merged)
    array.sort((a, b) => a.localeCompare(b) * -1)
    return array
  }

  function formatIdentity(identity: Identity) {
    if (identity.kind === 'person') {
      return formatPerson(identity)
    }
    return identity.title
  }

  function formatPerson(person: Person) {
    let label = `${person.firstname} ${person.lastname}`
    const hasOtherFaculties = person.faculties.some((f) => !f.startsWith('f10'))
    if (hasOtherFaculties) {
      const faculties = person.faculties.map((f) => f.toUpperCase()).join(', ')
      label += ` (${faculties})`
    }
    return label
  }

  function formatEmploymentType({ employmentType, title }: Person) {
    switch (employmentType) {
      case 'unknown':
        if (title && (title.startsWith('Dr') || title.startsWith('Prof'))) {
          return title
        }
        return ''
      case 'prof':
        return title || 'Prof.'
      case 'wma':
        const wmaLabel = 'Wiss. Mitarbeiter*in'
        if (title && title.startsWith('Dr')) {
          return `${title} - ${wmaLabel}`
        }
        return wmaLabel
      case 'adjunct_lecturer':
        const label = 'Lehrauftrag'
        if (title && (title.startsWith('Dr') || title.startsWith('Prof'))) {
          return `${title} - ${label}`
        }
        return label
    }
  }

  function examPhaseLabel(phase: string) {
    switch (phase) {
      case 'wise_1':
        return 'Wintersemester (Jan.-Apr.)'
      case 'sose_1':
        return 'Sommersemester Phase 1 (Juli)'
      case 'sose_2':
        return 'Sommersemester Phase 2 (Sep.)'
      case 'sose':
        return 'Sommersemester Phase 1 (Juli) und 2 (Sep.)'
      case 'off_wise':
        return 'Außerhalb Prüfungswoche Wintersemester'
      case 'off_sose':
        return 'Außerhalb Prüfungswoche Sommersemester'
      case 'off_schedule':
        return 'Außerhalb der Prüfungswochen'
      case 'none':
        return 'Keine Angabe'
    }
  }
</script>

<script lang="ts">
  import * as Avatar from '$lib/components/ui/avatar/index.js'
  import { Badge } from '$lib/components/ui/badge'
  import * as Card from '$lib/components/ui/card/index.js'
  import { Separator } from '$lib/components/ui/separator'
  import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import { routesMap } from '$lib/routes.svelte'
  import type { Person } from '$lib/types/core'
  import type { Other } from '$lib/types/module-details'
  import type { AssessmentPrerequisite, AttendanceRequirement } from '$lib/types/module-protocol'
  import { cn } from '$lib/utils'
  import {
    Award,
    ChevronDown,
    ChevronUp,
    ClipboardCheck,
    Clock,
    ExternalLink,
    Globe,
    GraduationCap,
    Info,
    ShieldAlert,
    Users,
    XCircle
  } from '@lucide/svelte'
  import { marked } from 'marked'

  const {
    module,
    genericModuleOptions,
    isGenericModule
  }: {
    module: ModuleDetail
    genericModuleOptions: GenericModuleOption[]
    isGenericModule: boolean
  } = $props()

  $effect(() => {
    routesMap.selectedModule = { id: module.id, title: module.title }
  })

  const ectsFactors = $derived(createECTSFactors(module))
  const examPhases = $derived(createExamPhases(module))
  const contact = $derived(createWorkloadContactHours(module))
  const degrees = $derived(createDegrees(module))
  const studyProgramsMandatory = $derived(createStudyPrograms(module.poMandatory))
  const studyProgramsOptional = $derived(createStudyPrograms(module.poOptional))
  let selectedEctsFactor = $derived(ectsFactors[0].toString())
  const total = $derived(+selectedEctsFactor * module.ects)
  const selfStudy = $derived(total - contact)
  const hasMultipleECTSFactors = $derived(ectsFactors.length > 1)
  let isWorkloadDetailsExpanded = $state(true)
  let isAssessmentPrerequisiteExpanded = $state(false)
  let isAttendanceRequirementExpanded = $state(false)
  const lastModified = $derived(
    new Date(module.lastModified).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  )
  let isGenericModuleExpanded = $state(false)
  let selectedLanguage = $derived.by(() => {
    const lang = module.language.id
    switch (lang) {
      case 'de':
      case 'de_en':
      case 'de_or_en':
        return 'de'
      case 'en':
        return 'en'
      default:
        return 'de'
    }
  })
</script>

{#snippet markdown(title: string, body: string)}
  <h2>{title}</h2>
  {#if body}
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    <div>{@html marked.parse(body)}</div>
  {:else if selectedLanguage === 'en'}
    <p>No information</p>
  {:else}
    <p>Keine Angabe</p>
  {/if}
{/snippet}

{#snippet rawAvatar(person: Person)}
  <Avatar.Root class="h-12 w-12 bg-muted">
    {#if person.imageUrl}
      <Avatar.Image
        src={person.imageUrl}
        alt={person.firstname + ' ' + person.lastname}
        class="object-cover"
      />
      <Avatar.Fallback>{person.abbreviation}</Avatar.Fallback>
    {:else}
      <Avatar.Fallback>{person.abbreviation}</Avatar.Fallback>
    {/if}
  </Avatar.Root>
  <div class="flex flex-col">
    <div class="font-medium">{formatPerson(person)}</div>
    <div class="text-sm text-muted-foreground">{formatEmploymentType(person)}</div>
  </div>
{/snippet}

{#snippet avatar(person: Person)}
  {#if person.websiteUrl}
    <a
      href={person.websiteUrl}
      target="_blank"
      rel="noopener noreferrer"
      class="flex cursor-pointer items-center gap-4 rounded-md transition-colors hover:bg-muted"
    >
      {@render rawAvatar(person)}
    </a>
  {:else}
    <div class="flex items-center gap-4">
      {@render rawAvatar(person)}
    </div>
  {/if}
{/snippet}

{#snippet group(other: Other)}
  <div class="flex items-center gap-2">
    <Avatar.Root class="h-12 w-12 bg-muted">
      <Avatar.Fallback><Users class="h-4 w-4" /></Avatar.Fallback>
    </Avatar.Root>
    <div class="font-medium">{other.title}</div>
  </div>
{/snippet}

{#snippet studyPrograms(studyPrograms: ReturnType<typeof createStudyPrograms>)}
  <div class="space-y-1.5">
    {#each studyPrograms as studyProgram, index (index)}
      <div class="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div class="flex flex-wrap items-center gap-1">
          <span class="font-medium">{studyProgram.studyProgram}</span>
          {#each studyProgram.poVersions as poVersion (poVersion)}
            <Badge variant="outline">PO-{poVersion}</Badge>
          {/each}
          {#each studyProgram.specializations as specialization (specialization.abbrev)}
            <Tooltip.Provider>
              <Tooltip.Root>
                <Tooltip.Trigger>
                  <Badge
                    variant="outline"
                    class="cursor-help border-blue-200 bg-blue-100 text-blue-800"
                  >
                    {specialization.abbrev}
                  </Badge>
                </Tooltip.Trigger>
                <Tooltip.Content>
                  <p>Schwerpunkt: {specialization.label}</p>
                </Tooltip.Content>
              </Tooltip.Root>
            </Tooltip.Provider>
          {/each}
        </div>
        <div class="whitespace-nowrap text-sm text-muted-foreground sm:text-right">
          {studyProgram.semester.length > 0 ? `Sem. ${studyProgram.semester.join(', ')}` : 'N/A'}
        </div>
      </div>
    {:else}
      <p class="font-medium">Keine Zuordnung</p>
    {/each}
  </div>
{/snippet}

{#snippet moduleLinks(modules: ModuleShort[])}
  {@const mods = modules?.toSorted((a, b) => a.title.localeCompare(b.title))}

  {#each mods as module, i (module.id)}
    <a title={module.title} href={`/modules/${module.id}`} class="font-medium underline"
      >{module.abbreviation}</a
    >{#if i < modules.length - 1}<span>,&nbsp</span>{/if}
  {/each}
{/snippet}

{#snippet prerequisiteModules(modules: ModuleShort[] | undefined)}
  {#if modules && modules.length > 0}
    <div>
      <span>Module:&nbsp</span>
      {@render moduleLinks(modules)}
    </div>
  {/if}
{/snippet}

{#snippet requiredPrerequisites(
  requiredPrerequisites: Prerequisite | null,
  assessmentPrerequisite: AssessmentPrerequisite | null,
  attendanceRequirement: AttendanceRequirement | null
)}
  {#if requiredPrerequisites || assessmentPrerequisite || attendanceRequirement}
    {#if attendanceRequirement}
      <button
        type="button"
        class="flex w-full cursor-pointer flex-wrap items-center justify-between rounded-md text-left transition-colors hover:bg-muted/50"
        onclick={() => (isAttendanceRequirementExpanded = !isAttendanceRequirementExpanded)}
        onkeydown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            isAttendanceRequirementExpanded = !isAttendanceRequirementExpanded
          }
        }}
        aria-expanded={isAttendanceRequirementExpanded}
        aria-controls="attendance-requirement-details"
      >
        <div class="flex items-center gap-2">
          <span class="font-medium">Anwesenheitspflichtig</span>
        </div>
        <div class="flex items-center gap-1 text-sm text-muted-foreground">
          <Info class="h-3 w-3" />
          <span>Weitere Infos</span>
          {#if isAttendanceRequirementExpanded}
            <ChevronUp class="h-4 w-4" />
          {:else}
            <ChevronDown class="h-4 w-4" />
          {/if}
        </div>
      </button>
      {#if isAttendanceRequirementExpanded}
        <div id="attendance-requirement-details" class="space-y-2 pl-4">
          <div class="space-y-1">
            <div class="text-sm text-muted-foreground">Mindestpräsenzzeit</div>
            <div>{attendanceRequirement.min}</div>
          </div>
          <div class="space-y-1">
            <div class="text-sm text-muted-foreground">Umgang mit Fehlzeiten</div>
            <div>{attendanceRequirement.absence}</div>
          </div>
        </div>
      {/if}
    {/if}
    {#if assessmentPrerequisite}
      <button
        type="button"
        class="flex w-full cursor-pointer flex-wrap items-center justify-between rounded-md text-left transition-colors hover:bg-muted/50"
        onclick={() => (isAssessmentPrerequisiteExpanded = !isAssessmentPrerequisiteExpanded)}
        onkeydown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            isAssessmentPrerequisiteExpanded = !isAssessmentPrerequisiteExpanded
          }
        }}
        aria-expanded={isAssessmentPrerequisiteExpanded}
        aria-controls="assessment-prerequisite-details"
      >
        <div class="flex items-center gap-2">
          <span class="font-medium">Vorleistungen erforderlich</span>
        </div>
        <div class="flex items-center gap-1 text-sm text-muted-foreground">
          <Info class="h-3 w-3" />
          <span>Weitere Infos</span>
          {#if isAssessmentPrerequisiteExpanded}
            <ChevronUp class="h-4 w-4" />
          {:else}
            <ChevronDown class="h-4 w-4" />
          {/if}
        </div>
      </button>
      {#if isAssessmentPrerequisiteExpanded}
        <div id="assessment-prerequisite-details" class="space-y-2 pl-4">
          <div class="space-y-1">
            <div>{assessmentPrerequisite.modules}</div>
          </div>
        </div>
      {/if}
    {/if}
    {#if requiredPrerequisites?.text}
      <div class="border-l-2 border-muted-foreground/30 pl-2 italic">
        {requiredPrerequisites.text}
      </div>
    {/if}
    {@render prerequisiteModules(requiredPrerequisites?.modules)}
  {:else}
    <p class="font-medium">Keine Angabe</p>
  {/if}
{/snippet}

<!-- px-6 -->
<div class="space-y-8">
  <!-- Module Header -->
  <div class="space-y-4">
    <h1 class="text-3xl font-bold tracking-tight">{module.title}</h1>
    <div class="flex flex-wrap items-center gap-2">
      {#if module.status.id === 'inactive'}
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger>
              <Badge
                class="flex cursor-help items-center border-red-200 bg-red-100 px-4 py-1 text-red-800 hover:bg-red-100"
              >
                <XCircle class="mr-1.5 h-4 w-4 flex-shrink-0 " />
                <span class="text-sm">{module.status.label}</span>
              </Badge>
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p>Das Modul wird aktuell nicht angeboten.</p>
            </Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>
      {/if}
      <Badge variant="outline" class="flex items-center px-4 py-1 text-muted-foreground">
        <Award class="mr-1.5 h-4 w-4 flex-shrink-0" />
        <span class="text-sm">{module.ects} ECTS</span>
      </Badge>
      <Badge variant="outline" class="flex items-center px-4 py-1 text-muted-foreground">
        <Globe class="mr-1.5 h-4 w-4 flex-shrink-0" />
        <span class="text-sm">{module.language.label}</span>
      </Badge>
      {#each degrees as degree (degree)}
        <Badge variant="outline" class="flex items-center px-4 py-1 text-muted-foreground">
          <GraduationCap class="mr-1.5 h-4 w-4 flex-shrink-0" />
          <span class="text-sm">{degree}</span>
        </Badge>
      {/each}
    </div>
    <p class="text-sm text-muted-foreground">
      Letzte Aktualisierung: {lastModified}
    </p>
  </div>

  <!-- Module Information Card -->

  <div class="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
    <!-- general information + (module relations) -->
    <Card.Root>
      <Card.Header>
        <Card.Title class="flex items-center gap-2">
          <Info class="h-5 w-5" />
          Grunddaten
        </Card.Title>
      </Card.Header>
      <Card.Content class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-sm text-muted-foreground">Kürzel</span>
          <span class="font-medium">{module.abbreviation}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-muted-foreground">Dauer des Moduls</span>
          <span class="font-medium">{module.duration} Semester</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-muted-foreground">Angeboten im</span>
          <span class="font-medium">{module.season}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-muted-foreground">Veranstaltungsort</span>
          <span class="font-medium">{module.location}</span>
        </div>
        {#if module.moduleRelation}
          <div class="flex items-center justify-between">
            {#if module.moduleRelation.relationType === 'parent'}
              <span class="text-sm text-muted-foreground">Hat Teilmodule</span>
              <div>{@render moduleLinks(module.moduleRelation.modules)}</div>
            {:else if module.moduleRelation.relationType === 'child'}
              <span class="text-sm text-muted-foreground">Teil von Obermodul</span>
              <div>{@render moduleLinks([module.moduleRelation.module])}</div>
            {/if}
          </div>
        {/if}
        {#if isGenericModule && genericModuleOptions.length > 0}
          <button
            type="button"
            class="flex w-full cursor-pointer flex-wrap items-center justify-between rounded-md text-left transition-colors hover:bg-muted/50"
            onclick={() => (isGenericModuleExpanded = !isGenericModuleExpanded)}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                isGenericModuleExpanded = !isGenericModuleExpanded
              }
            }}
            aria-expanded={isGenericModuleExpanded}
            aria-controls="generic-module-details"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm text-muted-foreground">Wählbare Moduloptionen</span>
              {#if isGenericModuleExpanded}
                <ChevronUp class="h-4 w-4 text-muted-foreground" />
              {:else}
                <ChevronDown class="h-4 w-4 text-muted-foreground" />
              {/if}
            </div>
            <span class="font-medium"
              >{genericModuleOptions.length}
              {genericModuleOptions.length === 1 ? 'Modul' : 'Module'}</span
            >
          </button>
          {#if isGenericModuleExpanded}
            <div id="generic-module-details" class="pl-4">
              <ul class="list-none space-y-2">
                {#each genericModuleOptions as module (module.id)}
                  <li class="flex items-baseline gap-2">
                    <ExternalLink class="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <a
                      title={module.title}
                      href={`/modules/${module.id}`}
                      class={cn(module.status === 'inactive' && 'line-through')}
                    >
                      {module.title}
                    </a>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}
        {/if}
      </Card.Content>
    </Card.Root>

    <!-- management info (employment type, website url, image) -->
    <Card.Root>
      <Card.Header>
        <Card.Title class="flex items-center gap-2">
          <Users class="h-5 w-5" />
          Verantwortliche
        </Card.Title>
      </Card.Header>
      <Card.Content class="space-y-4">
        <div class="text-sm text-muted-foreground">Modulverantwortung</div>
        {#each module.moduleManagement as management (management.id)}
          {#if management.kind === 'person'}
            {@render avatar(management)}
          {:else}
            {@render group(management)}
          {/if}
        {/each}
        <Separator />
        <div class="text-sm text-muted-foreground">Lehrende</div>
        {#each module.lecturer as lecturer (lecturer.id)}
          {#if lecturer.kind === 'person'}
            {@render avatar(lecturer)}
          {:else}
            {@render group(lecturer)}
          {/if}
        {/each}
      </Card.Content>
    </Card.Root>

    <!-- examination -->
    {#if !isGenericModule}
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <ClipboardCheck class="h-5 w-5" />
            Prüfung
          </Card.Title>
        </Card.Header>
        <Card.Content class="space-y-4">
          <div class="space-y-1">
            <div class="text-sm text-muted-foreground">Prüfungsformen</div>
            {#each module.assessments as assessment, index (index)}
              <p class="font-medium">
                {assessment.label}
                {#if assessment.percentage}
                  <span class="font-normal text-muted-foreground">({assessment.percentage} %)</span>
                {/if}
              </p>
            {:else}
              <p class="font-medium">Keine Angabe</p>
            {/each}
          </div>

          <div class="space-y-1">
            <div class="text-sm text-muted-foreground">Prüfungsphasen</div>
            {#each examPhases as phase (phase)}
              <p class="font-medium">{examPhaseLabel(phase)}</p>
            {:else}
              <p class="font-medium">Keine Angabe</p>
            {/each}
          </div>

          <div class="space-y-1">
            <div class="text-sm text-muted-foreground">Prüfende</div>
            <div class="flex items-center gap-2 font-medium">
              <span class="w-4">1.</span>
              <span>{formatIdentity(module.firstExaminer)}</span>
            </div>
            <div class="flex items-center gap-2 font-medium">
              <span class="w-4">2.</span>
              <span>{formatIdentity(module.secondExaminer)}</span>
            </div>
          </div>
        </Card.Content>
      </Card.Root>
    {/if}

    <!-- workload -->
    {#if !isGenericModule}
      <Card.Root>
        <Card.Header>
          <div class="flex items-center justify-between">
            <Card.Title class="flex items-center gap-2">
              <Clock class="h-5 w-5" />
              Workload
            </Card.Title>
            {#if hasMultipleECTSFactors}
              <div class="flex items-center gap-1">
                <ToggleGroup.Root
                  type="single"
                  value={selectedEctsFactor}
                  variant="outline"
                  onValueChange={(value) => {
                    // prevent deselection at business logic level
                    if (value) {
                      selectedEctsFactor = value
                    }
                  }}
                >
                  {#each ectsFactors as factor (factor)}
                    <ToggleGroup.Item
                      value={factor.toString()}
                      onclick={(e) => {
                        // prevent deselection at UI level
                        if (selectedEctsFactor === factor.toString()) {
                          e.preventDefault()
                        }
                      }}
                    >
                      {factor}
                    </ToggleGroup.Item>
                  {/each}
                </ToggleGroup.Root>
                <sup>*</sup>
              </div>
            {/if}
          </div>
        </Card.Header>
        <Card.Content class="space-y-2">
          <button
            type="button"
            class="flex w-full cursor-pointer items-center justify-between rounded-md text-left transition-colors hover:bg-muted/50"
            onclick={() => (isWorkloadDetailsExpanded = !isWorkloadDetailsExpanded)}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                isWorkloadDetailsExpanded = !isWorkloadDetailsExpanded
              }
            }}
            aria-expanded={isWorkloadDetailsExpanded}
            aria-controls="workload-details"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm text-muted-foreground">Präsenzzeit</span>
              {#if isWorkloadDetailsExpanded}
                <ChevronUp class="h-4 w-4 text-muted-foreground" />
              {:else}
                <ChevronDown class="h-4 w-4 text-muted-foreground" />
              {/if}
            </div>
            <span class="font-medium">{contact} h</span>
          </button>
          {#if isWorkloadDetailsExpanded}
            <div id="workload-details" class="space-y-1 pl-4">
              <div class="flex items-center justify-between">
                <span class="text-sm text-muted-foreground">Vorlesung</span>
                <span class="font-medium">{module.workload.lecture} h</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-muted-foreground">Übung</span>
                <span class="font-medium">{module.workload.exercise} h</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-muted-foreground">Seminar</span>
                <span class="font-medium">{module.workload.seminar} h</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-muted-foreground">Praktikum</span>
                <span class="font-medium">{module.workload.practical} h</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-muted-foreground">Projektbetreuung</span>
                <span class="font-medium">{module.workload.projectSupervision} h</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-muted-foreground">Projektarbeit</span>
                <span class="font-medium">{module.workload.projectWork} h</span>
              </div>
            </div>
          {/if}
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">Selbststudium</span>
            <span class="font-medium">{selfStudy} h</span>
          </div>
          <Separator />
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">Gesamt</span>
            <span class="font-medium">{total} h</span>
          </div>
        </Card.Content>
        {#if hasMultipleECTSFactors}
          <Card.Footer>
            <div class="text-sm text-muted-foreground">
              <sup>*</sup>Dieses Modul ist Studiengängen zugeordnet, die unterschiedliche
              ECTS-Faktoren haben. Für eine korrekte Darstellung des Workloads ist die Auswahl eines
              ECTS-Faktors notwendig.
            </div>
          </Card.Footer>
        {/if}
      </Card.Root>
    {/if}

    <!-- study programs (po and elective) -->
    <Card.Root class="col-span-1">
      <Card.Header>
        <Card.Title class="flex items-center gap-2">
          <GraduationCap class="h-6 w-6" />
          Studiengänge
        </Card.Title>
      </Card.Header>
      <Card.Content class="space-y-2">
        <div class="text-sm text-muted-foreground">Pflichtmodul</div>
        {@render studyPrograms(studyProgramsMandatory)}
        <div class="text-sm text-muted-foreground">Wahlmodul</div>
        {@render studyPrograms(studyProgramsOptional)}
      </Card.Content>
    </Card.Root>

    <!-- prerequisites -->
    <Card.Root class="col-span-1">
      <Card.Header>
        <Card.Title class="flex items-center gap-2">
          <ShieldAlert class="h-5 w-5" />
          Voraussetzungen
        </Card.Title>
      </Card.Header>
      <Card.Content class="space-y-2">
        <div class="text-sm text-muted-foreground">Zwingend</div>
        {@render requiredPrerequisites(
          module.requiredPrerequisites,
          module.assessmentPrerequisite,
          module.attendanceRequirement
        )}
        {#if module.recommendedPrerequisites}
          <div class="text-sm text-muted-foreground">Empfohlen</div>
          {#if module.recommendedPrerequisites.text}
            <div class="border-l-2 border-muted-foreground/30 pl-2 italic">
              {module.recommendedPrerequisites.text}
            </div>
          {/if}
          {@render prerequisiteModules(module.recommendedPrerequisites.modules)}
        {/if}
      </Card.Content>
    </Card.Root>
  </div>

  <Separator />

  <!-- Module Content -->

  <div class="flex items-center gap-1">
    <ToggleGroup.Root
      type="single"
      value={selectedLanguage}
      variant="outline"
      onValueChange={(value) => {
        if (value) {
          selectedLanguage = value
        }
      }}
    >
      <ToggleGroup.Item
        value="de"
        onclick={(e) => {
          if (selectedLanguage === 'de') {
            e.preventDefault()
          }
        }}
        class="flex items-center gap-2"
      >
        <img src="/flags/de-flag-circle.svg" alt="German flag" class="h-5 w-5" />
        Deutsch
      </ToggleGroup.Item>
      <ToggleGroup.Item
        value="en"
        onclick={(e) => {
          if (selectedLanguage === 'en') {
            e.preventDefault()
          }
        }}
        class="flex items-center gap-2"
      >
        <img src="/flags/us-flag-circle.svg" alt="US flag" class="h-5 w-5" />
        English
      </ToggleGroup.Item>
    </ToggleGroup.Root>
  </div>

  <div class="prose dark:prose-invert max-w-none">
    {#if selectedLanguage === 'en'}
      {@render markdown('Learning Outcome', module.enContent.learningOutcome)}
      {@render markdown('Module Content', module.enContent.moduleContent)}
      {@render markdown('Teaching and Learning Methods', module.enContent.learningMethods)}
      {@render markdown('Recommended Reading', module.enContent.literature)}
      {@render markdown('Particularities', module.enContent.particularities)}
    {:else}
      {@render markdown('Angestrebte Lernergebnisse', module.deContent.learningOutcome)}
      {@render markdown('Modulinhalte', module.deContent.moduleContent)}
      {@render markdown('Lehr- und Lernmethoden (Medienformen)', module.deContent.learningMethods)}
      {@render markdown('Empfohlene Literatur', module.deContent.literature)}
      {@render markdown('Besonderheiten', module.deContent.particularities)}
    {/if}
  </div>
</div>
