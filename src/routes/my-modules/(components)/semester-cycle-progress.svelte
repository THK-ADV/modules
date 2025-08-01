<script lang="ts" module>
  type Phase = 'editing' | 'finalizing' | 'publishing'

  // Phase boundary constants
  const EDITING_PHASE_END = 90
  const FINALIZING_PHASE_END = 99

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
      primary: 'blue',
      bgLight: 'bg-blue-100',
      bgProgress: 'bg-blue-500',
      border: 'border-blue-500',
      textPrimary: 'text-blue-900',
      textSecondary: 'text-blue-800',
      textButton: 'text-blue-700',
      textButtonHover: 'hover:text-blue-900'
    },
    finalizing: {
      primary: 'orange',
      bgLight: 'bg-orange-100',
      bgProgress: 'bg-orange-500',
      border: 'border-orange-500',
      textPrimary: 'text-orange-900',
      textSecondary: 'text-orange-800',
      textButton: 'text-orange-700',
      textButtonHover: 'hover:text-orange-900'
    },
    publishing: {
      primary: 'green',
      bgLight: 'bg-green-100',
      bgProgress: 'bg-green-500',
      border: 'border-green-500',
      textPrimary: 'text-green-900',
      textSecondary: 'text-green-800',
      textButton: 'text-green-700',
      textButtonHover: 'hover:text-green-900'
    }
  } as const

  // Phase content configuration
  const PHASE_CONTENT = {
    editing: {
      icon: '🎯',
      title: 'Aktuelle Phase: Bearbeitung',
      description:
        'Sie können Ihre Module jetzt bearbeiten und Änderungen vornehmen. Alle Änderungen sind nur für Sie und berechtigte Personen sichtbar. Prüfen Sie vor allem die Prüfungsformen für das nächste Semester. Aktualisieren Sie auch Ihre Wahlmodule und WPFs.',
      actionTitle: '💡 Empfohlene Aktionen',
      actions: [
        'Module überprüfen und aktualisieren',
        'Änderungen regelmäßig speichern',
        'Bei Bedarf zur Genehmigung freigeben'
      ]
    },
    finalizing: {
      icon: '⚡',
      title: 'Aktuelle Phase: Finalisierung',
      description:
        'Die Bearbeitungsphase neigt sich dem Ende zu. Stellen Sie sicher, dass alle Änderungen abgeschlossen und übernommen wurden. Moduländerungen, die nicht übernommen oder zur Genehmigung freigegeben wurden, werden nicht in der nächsten Ausgabe des Modulhandbuchs und der Modulsuche aufgeführt.',
      actionTitle: '⚠️ Dringende Aktionen',
      actions: [
        'Letzte Änderungen vornehmen',
        'Module zur Übernahme freigeben',
        'Genehmigungen abwarten'
      ]
    },
    publishing: {
      icon: '✅',
      title: 'Aktuelle Phase: Veröffentlichung',
      description:
        'Der Bearbeitungszyklus ist abgeschlossen. Keine Änderungen mehr möglich! Alle finalisierten Änderungen werden jetzt im Modulhandbuch und der Modulsuche veröffentlicht.',
      actionTitle: '📋 Nächste Schritte',
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
  import { ChevronDown, ChevronUp, Info } from '@lucide/svelte'

  let {
    isPublishingPhase = $bindable(),
    showComponent
  }: { isPublishingPhase?: boolean; showComponent: boolean } = $props()

  let showProcessExplanation = $state(false)

  const currentDate = new Date()
  const semesterInfo = calculateSemesterInfo(currentDate)
  const cycleProgress = calculateProgress(currentDate, semesterInfo)
  const currentPhase = determinePhase(cycleProgress)
  const phaseTheme = PHASE_THEMES[currentPhase]
  const phaseContent = PHASE_CONTENT[currentPhase]

  $effect(() => {
    isPublishingPhase = currentPhase === 'publishing'
  })

  // toggle process explanation
  function toggleProcessExplanation() {
    showProcessExplanation = !showProcessExplanation
  }
</script>

{#if showComponent}
  <div class="rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
    <div class="mb-4">
      <h3 class="text-lg font-semibold text-gray-900">
        Bearbeitungszyklus {semesterInfo.type}
        {semesterInfo.period}
      </h3>
      <p class="mt-1 text-sm text-gray-600">
        {semesterInfo.displayStart} - {semesterInfo.displayEnd}
      </p>
    </div>

    <!-- Progress Bar -->
    <div class="relative mb-6">
      <div class="mb-2 flex items-center justify-between text-xs text-gray-500">
        <span>Bearbeitungsphase</span>
        <span>Veröffentlichung</span>
      </div>

      <div class="relative h-3 w-full overflow-hidden rounded-full bg-gray-200">
        <!-- Background phases -->
        <div class="absolute inset-0 flex">
          <div style="width: {EDITING_PHASE_END}%" class={PHASE_THEMES.editing.bgLight}></div>
          <div
            style="width: {FINALIZING_PHASE_END - EDITING_PHASE_END}%"
            class={PHASE_THEMES.finalizing.bgLight}
          ></div>
          <div
            style="width: {100 - FINALIZING_PHASE_END}%"
            class={PHASE_THEMES.publishing.bgLight}
          ></div>
        </div>

        <!-- Progress fill -->
        <div
          class="relative z-10 h-full rounded-full transition-all duration-500 ease-out {phaseTheme.bgProgress}"
          style="width: {cycleProgress}%"
        ></div>

        <!-- Phase markers -->
        <div
          class="absolute top-0 h-full w-0.5 bg-gray-400 opacity-50"
          style="left: {EDITING_PHASE_END}%"
        ></div>
        <div
          class="absolute top-0 h-full w-0.5 bg-gray-400 opacity-50"
          style="left: {FINALIZING_PHASE_END}%"
        ></div>
      </div>

      <div class="mt-1 flex items-center justify-between text-xs text-gray-600">
        <span>{semesterInfo.displayStart}</span>
        <span class="font-medium">{cycleProgress}% abgeschlossen</span>
        <span>{semesterInfo.displayEnd}</span>
      </div>
    </div>

    <!-- Current Phase Information -->
    <div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
      <div class="rounded-lg border-l-4 {phaseTheme.border} {phaseTheme.bgLight} p-4 md:col-span-2">
        <div class="mb-2 flex items-center justify-between">
          <h4 class="font-medium {phaseTheme.textPrimary}">
            {phaseContent.icon}
            {phaseContent.title}
          </h4>
          {#if !isPublishingPhase}
            <button
              class="flex items-center gap-1 text-xs {phaseTheme.textButton} transition-colors {phaseTheme.textButtonHover} focus:outline-none focus:ring-2 focus:ring-{phaseTheme.primary}-500 rounded focus:ring-offset-1"
              onclick={toggleProcessExplanation}
              aria-expanded={showProcessExplanation}
              aria-label="Prozess-Erklärung {showProcessExplanation ? 'ausblenden' : 'anzeigen'}"
            >
              <Info class="h-3 w-3" />
              <span>Info</span>
              {#if showProcessExplanation}
                <ChevronUp class="h-3 w-3" />
              {:else}
                <ChevronDown class="h-3 w-3" />
              {/if}
            </button>
          {/if}
        </div>
        <p class="text-sm {phaseTheme.textSecondary}">
          {phaseContent.description}
        </p>
      </div>
      <div class="rounded-lg border bg-white p-4">
        <h5 class="mb-2 font-medium text-gray-900">{phaseContent.actionTitle}</h5>
        <ul class="space-y-1 text-sm text-gray-700">
          {#each phaseContent.actions as action, index (index)}
            <li>• {action}</li>
          {/each}
        </ul>
      </div>
    </div>

    <!-- Process Explanation (appears when toggled) -->
    {#if showProcessExplanation}
      <div class="mt-4 rounded-lg border bg-white p-4">
        <h5 class="mb-3 font-medium text-gray-900">So funktioniert der Bearbeitungszyklus</h5>
        <div class="space-y-2 text-sm text-gray-700">
          <p>
            <strong>Bearbeitungsphase (bis {EDITING_PHASE_END} % des Semesters):</strong> Sie können
            Ihre Module bearbeiten. Änderungen sind nur für Sie und berechtigte Personen sichtbar.
          </p>
          <p>
            <strong>Finalisierungsphase (bis {FINALIZING_PHASE_END} % des Semesters):</strong> Letzte
            Gelegenheit für Änderungen. Bereiten Sie Module für die Veröffentlichung vor.
          </p>
          <p>
            <strong>Veröffentlichung (die letzten {100 - FINALIZING_PHASE_END} %):</strong> Alle finalisierten
            Änderungen werden automatisch im Modulhandbuch und der Modulsuche veröffentlicht.
          </p>
        </div>
      </div>
    {/if}
  </div>
{/if}
