<script lang="ts" module>
  type Phase = 'editing' | 'finalizing' | 'publishing'

  // Phase boundary constants
  const EDITING_PHASE_END = 90
  const FINALIZING_PHASE_END = 99.9

  // Date constants for better readability
  const MONTHS = {
    MARCH: 2,
    AUGUST: 7,
    SEPTEMBER: 8,
    FEBRUARY: 1
  } as const

  // Semester boundary months
  const WINTER_SEMESTER_START_MONTH = 9
  const WINTER_SEMESTER_END_MONTH = 2

  // Color theme configurations
  const PHASE_THEMES = {
    editing: {
      dot: 'bg-green-500',
      bgSegment: 'bg-green-100 dark:bg-green-900/40',
      bgProgress: 'bg-green-500',
      bgPanel: 'from-green-50/50 to-green-50/20 dark:from-green-950/20 dark:to-green-950/5',
      accent: 'border-l-green-500 dark:border-l-green-400',
      textPrimary: 'text-green-900 dark:text-green-200',
      textSecondary: 'text-green-800 dark:text-green-300'
    },
    finalizing: {
      dot: 'bg-amber-500',
      bgSegment: 'bg-amber-100 dark:bg-amber-900/40',
      bgProgress: 'bg-amber-500',
      bgPanel: 'from-amber-50/50 to-amber-50/20 dark:from-amber-950/20 dark:to-amber-950/5',
      accent: 'border-l-amber-500 dark:border-l-amber-400',
      textPrimary: 'text-amber-900 dark:text-amber-200',
      textSecondary: 'text-amber-800 dark:text-amber-300'
    },
    publishing: {
      dot: 'bg-red-500',
      bgSegment: 'bg-red-100 dark:bg-red-900/40',
      bgProgress: 'bg-red-500',
      bgPanel: 'from-red-50/50 to-red-50/20 dark:from-red-950/20 dark:to-red-950/5',
      accent: 'border-l-red-500 dark:border-l-red-400',
      textPrimary: 'text-red-900 dark:text-red-200',
      textSecondary: 'text-red-800 dark:text-red-300'
    }
  } as const

  const PHASE_CONTENT = {
    editing: {
      title: 'Bearbeitungsphase',
      description:
        'Sie können Ihre Module jetzt bearbeiten und Änderungen vornehmen. Alle Änderungen sind nur für Sie und berechtigte Personen sichtbar. Prüfen Sie vor allem die Prüfungsformen für das nächste Semester. Aktualisieren Sie auch Ihre Wahlmodule und WPFs.',
      actions: [
        'Module überprüfen und aktualisieren',
        'Änderungen regelmäßig speichern',
        'Bei Bedarf zur Genehmigung freigeben'
      ]
    },
    finalizing: {
      title: 'Finalisierungsphase',
      description:
        'Die Bearbeitungsphase neigt sich dem Ende zu. Stellen Sie sicher, dass alle Änderungen abgeschlossen und übernommen wurden. Moduländerungen, die nicht übernommen oder zur Genehmigung freigegeben wurden, werden nicht in der nächsten Ausgabe des Modulhandbuchs und der Modulsuche aufgeführt.',
      actions: [
        'Letzte Änderungen vornehmen',
        'Module zur Übernahme freigeben',
        'Genehmigungen abwarten'
      ]
    },
    publishing: {
      title: 'Veröffentlichungsphase',
      description:
        'Der Bearbeitungszyklus ist abgeschlossen. Keine Änderungen mehr möglich. Alle finalisierten Änderungen werden jetzt im Modulhandbuch und der Modulsuche veröffentlicht.',
      actions: ['Warten auf nächsten Zyklus']
    }
  } as const

  // determine current semester and cycle dates
  function calculateSemesterInfo(currentDate: Date) {
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1 // getMonth() returns 0-11
    const isWinterSemester =
      currentMonth >= WINTER_SEMESTER_START_MONTH || currentMonth <= WINTER_SEMESTER_END_MONTH

    if (isWinterSemester) {
      // winter semester: Sep 1 - Feb 28/29
      const startYear = currentMonth >= WINTER_SEMESTER_START_MONTH ? currentYear : currentYear - 1
      const endYear = startYear + 1
      // use Date constructor to determine leap year - Feb 29 will be valid in leap years
      const endDay = new Date(endYear, MONTHS.FEBRUARY, 29).getMonth() === MONTHS.FEBRUARY ? 29 : 28

      return {
        type: 'Wintersemester',
        period: `${startYear}/${endYear}`,
        startDate: new Date(startYear, MONTHS.SEPTEMBER, 1),
        endDate: new Date(endYear, MONTHS.FEBRUARY, endDay),
        displayStart: `01.09.${startYear}`,
        displayEnd: `${endDay}.02.${endYear}`
      }
    } else {
      // summer semester: Mar 1 - Aug 31
      return {
        type: 'Sommersemester',
        period: currentYear.toString(),
        startDate: new Date(currentYear, MONTHS.MARCH, 1),
        endDate: new Date(currentYear, MONTHS.AUGUST, 31),
        displayStart: `01.03.${currentYear}`,
        displayEnd: `31.08.${currentYear}`
      }
    }
  }

  // calculate progress percentage
  function calculateProgress(
    currentDate: Date,
    semesterInfo: ReturnType<typeof calculateSemesterInfo>
  ): number {
    const now = currentDate.getTime()
    const start = semesterInfo.startDate.getTime()
    const end = semesterInfo.endDate.getTime()

    if (now < start) return 0
    if (now > end) return 100

    return Math.round(((now - start) / (end - start)) * 100)
  }

  // determine current phase
  function determinePhase(cycleProgress: number): Phase {
    if (cycleProgress < EDITING_PHASE_END) return 'editing'
    if (cycleProgress < FINALIZING_PHASE_END) return 'finalizing'
    return 'publishing'
  }
</script>

<script lang="ts">
  import { ChevronDown, ChevronUp } from '@lucide/svelte'

  let expanded = $state(false)

  const currentDate = new Date()
  const semesterInfo = calculateSemesterInfo(currentDate)
  const cycleProgress = calculateProgress(currentDate, semesterInfo)
  const currentPhase = determinePhase(cycleProgress)
  const phaseTheme = PHASE_THEMES[currentPhase]
  const phaseContent = PHASE_CONTENT[currentPhase]
</script>

<div class="border-border/80 overflow-hidden rounded-lg border">
  <!-- Compact summary bar -->
  <button
    onclick={() => (expanded = !expanded)}
    aria-expanded={expanded}
    class="bg-muted/30 hover:bg-muted/50 flex w-full items-center gap-4 px-4 py-3 text-left transition-colors"
  >
    <span class="size-2.5 shrink-0 rounded-full {phaseTheme.dot}"></span>

    <div class="flex min-w-0 flex-1 items-center gap-3">
      <span class="text-sm font-medium">{phaseContent.title}</span>
      <span class="text-muted-foreground hidden text-xs sm:inline">
        {semesterInfo.type}
        {semesterInfo.period}
      </span>
    </div>

    <div class="flex shrink-0 items-center gap-3">
      <div class="hidden items-center gap-2 sm:flex">
        <div class="bg-border h-1.5 w-20 overflow-hidden rounded-full">
          <div
            class="h-full rounded-full {phaseTheme.bgProgress}"
            style="width: {cycleProgress}%"
          ></div>
        </div>
        <span class="text-muted-foreground w-8 text-right text-xs font-medium tabular-nums">
          {cycleProgress}%
        </span>
      </div>

      {#if expanded}
        <ChevronUp class="text-muted-foreground size-4" />
      {:else}
        <ChevronDown class="text-muted-foreground size-4" />
      {/if}
    </div>
  </button>

  <!-- Expanded detail panel -->
  {#if expanded}
    <div class="border-border/60 space-y-5 border-t bg-linear-to-b {phaseTheme.bgPanel} p-5">
      <!-- Progress bar -->
      <div>
        <div class="bg-border relative h-2.5 w-full overflow-hidden rounded-full">
          <div class="absolute inset-0 flex">
            <div style="width: {EDITING_PHASE_END}%" class={PHASE_THEMES.editing.bgSegment}></div>
            <div
              style="width: {FINALIZING_PHASE_END - EDITING_PHASE_END}%"
              class={PHASE_THEMES.finalizing.bgSegment}
            ></div>
            <div
              style="width: {100 - FINALIZING_PHASE_END}%"
              class={PHASE_THEMES.publishing.bgSegment}
            ></div>
          </div>

          <div
            class="relative z-10 h-full rounded-full {phaseTheme.bgProgress} transition-all duration-500 ease-out"
            style="width: {cycleProgress}%"
          ></div>

          <div
            class="bg-foreground/30 absolute top-0 h-full w-px"
            style="left: {EDITING_PHASE_END}%"
          ></div>
          <div
            class="bg-foreground/30 absolute top-0 h-full w-px"
            style="left: {FINALIZING_PHASE_END}%"
          ></div>
        </div>

        <div class="text-muted-foreground mt-1.5 flex items-center justify-between text-xs">
          <span>{semesterInfo.displayStart}</span>
          <span class="font-medium tabular-nums">{cycleProgress}% abgeschlossen</span>
          <span>{semesterInfo.displayEnd}</span>
        </div>
      </div>

      <!-- Phase description with accent border -->
      <div class="border-l-2 {phaseTheme.accent} pl-4">
        <h4 class="text-sm font-medium {phaseTheme.textPrimary}">
          {phaseContent.title}
        </h4>
        <p class="mt-1 text-sm {phaseTheme.textSecondary}">
          {phaseContent.description}
        </p>

        {#if phaseContent.actions.length > 0}
          <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {#each phaseContent.actions as action, index (index)}
              <li class="text-muted-foreground flex items-center gap-1.5 text-xs">
                <span class="size-1 rounded-full bg-current opacity-60"></span>
                {action}
              </li>
            {/each}
          </ul>
        {/if}
      </div>

      <!-- Cycle explanation — always visible when expanded, no nested toggle -->
      <details class="group/details">
        <summary
          class="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1.5 text-xs font-medium transition-colors select-none"
        >
          <span>So funktioniert der Bearbeitungszyklus</span>
          <ChevronDown class="size-3 transition-transform group-open/details:rotate-180" />
        </summary>
        <div class="text-muted-foreground mt-3 space-y-2 text-sm">
          <p>
            <strong class="text-foreground font-medium"
              >Bearbeitungsphase (bis {EDITING_PHASE_END}%):</strong
            >
            Module bearbeiten. Änderungen sind nur für Sie und berechtigte Personen sichtbar.
          </p>
          <p>
            <strong class="text-foreground font-medium"
              >Finalisierung (bis {FINALIZING_PHASE_END}%):</strong
            >
            Letzte Gelegenheit für Änderungen. Module für die Veröffentlichung vorbereiten.
          </p>
          <p>
            <strong class="text-foreground font-medium"
              >Veröffentlichung ({(100 - FINALIZING_PHASE_END).toFixed(1)}%):</strong
            >
            Alle finalisierten Änderungen werden im Modulhandbuch und der Modulsuche veröffentlicht.
          </p>
        </div>
      </details>
    </div>
  {/if}
</div>
