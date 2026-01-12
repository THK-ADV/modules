<script lang="ts">
  import { browser, dev } from '$app/environment'
  import { beforeNavigate, goto } from '$app/navigation'
  import { page } from '$app/state'
  import ModificationIndicator from '$lib/components/modification-indicator.svelte'
  import ModuleApprovalStatus from '$lib/components/module-approval-status.svelte'
  import ModuleReviewSummary from '$lib/components/module-review-summary.svelte'
  import Button from '$lib/components/ui/button/button.svelte'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import LoadingOverlay from '$lib/components/ui/loading-overlay/loading-overlay.svelte'
  import Separator from '$lib/components/ui/separator/separator.svelte'
  import Spinner from '$lib/components/ui/spinner/spinner.svelte'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import { routesMap } from '$lib/routes.svelte'
  import { moduleSchema } from '$lib/schemas/module'
  import {
    getSectionStatus,
    type FormFieldPath,
    type Section,
    type SectionId
  } from '$lib/types/module-draft-keys'
  import { cn } from '$lib/utils'
  import SuperDebug, { superForm } from 'sveltekit-superforms'
  import { zodClient } from 'sveltekit-superforms/adapters'
  import type { LayoutProps } from './$types'
  import { setModuleFormContext } from './context'

  let { children, data, params }: LayoutProps = $props()

  // svelte-ignore state_referenced_locally
  routesMap.selectedModule = { id: data.module.id, title: data.module.metadata.title }

  const id = $derived(params.id)

  const isReviewMode = $derived.by(() => page.url.searchParams.get('mode') === 'review')

  let reviewInProgress = $state(false)

  const sections: Section[] = $derived([
    {
      id: 'general',
      label: 'Allgemeine Informationen',
      href: `/my-modules/${id}/general`
    },
    {
      id: 'management',
      label: 'Verantwortliche',
      href: `/my-modules/${id}/management`
    },
    {
      id: 'examination',
      label: 'Prüfungsleistungen',
      href: `/my-modules/${id}/examination`
    },
    {
      id: 'workload',
      label: 'Workload',
      href: `/my-modules/${id}/workload`
    },
    {
      id: 'study-programs',
      label: 'Zuordnung zu Studiengängen',
      href: `/my-modules/${id}/study-programs`
    },
    {
      id: 'learning-outcomes',
      label: 'Learning Outcomes',
      href: `/my-modules/${id}/learning-outcomes`
    },
    {
      id: 'module-content',
      label: 'Modulinhalte',
      href: `/my-modules/${id}/module-content`
    },
    {
      id: 'teaching-methods',
      label: 'Lehr- und Lernmethoden',
      href: `/my-modules/${id}/teaching-methods`
    },
    {
      id: 'literature',
      label: 'Empfohlene Literatur',
      href: `/my-modules/${id}/literature`
    },
    {
      id: 'particularities',
      label: 'Besonderheiten',
      href: `/my-modules/${id}/particularities`
    },
    {
      id: 'prerequisites',
      label: 'Voraussetzungen',
      href: `/my-modules/${id}/prerequisites`
    },
    {
      id: 'misc',
      label: 'Sonstige Informationen',
      href: `/my-modules/${id}/misc`
    }
  ] as const)

  // svelte-ignore state_referenced_locally
  const form = superForm(data.form, {
    validators: zodClient(moduleSchema),
    dataType: 'json',
    onError: ({ result }) => {
      console.error('Form submission failed:', result)
    },
    onUpdated: ({ form }) => {
      // redirect, if form submission was successful and no server error occurred
      if (form.valid && Object.keys(form.errors).length === 0 && !page.form?.message) {
        if (isReviewMode) {
          if (browser) {
            location.reload()
          }
        } else {
          goto('/my-modules?updated=true')
        }
      }
    }
  })

  setModuleFormContext(form)

  const { form: formData, enhance, tainted, allErrors, submitting } = form

  // handle error hints

  const fieldToSectionMap: Record<FormFieldPath, SectionId> = {
    // General section
    title: 'general',
    abbrev: 'general',
    moduleType: 'general',
    ects: 'general',
    language: 'general',
    duration: 'general',
    season: 'general',
    location: 'general',
    status: 'general',

    // Management section
    management: 'management',
    lecturers: 'management',
    updatePermissions: 'management',

    // Examination section
    firstExaminer: 'examination',
    secondExaminer: 'examination',
    examPhases: 'examination',
    assessmentMethods: 'examination',

    // Workload section
    workload: 'workload',
    'workload.lecture': 'workload',
    'workload.seminar': 'workload',
    'workload.exercise': 'workload',
    'workload.practical': 'workload',
    'workload.projectSupervision': 'workload',
    'workload.projectWork': 'workload',

    // Study programs section
    po: 'study-programs',
    'po.mandatory': 'study-programs',
    'po.optional': 'study-programs',

    // Content sections - top level objects
    deContent: 'learning-outcomes', // Default to learning-outcomes, but specific fields override
    enContent: 'learning-outcomes', // Default to learning-outcomes, but specific fields override

    // Learning outcomes section
    'deContent.learningOutcome': 'learning-outcomes',
    'enContent.learningOutcome': 'learning-outcomes',

    // Module content section
    'deContent.content': 'module-content',
    'enContent.content': 'module-content',

    // Teaching methods section
    'deContent.teachingAndLearningMethods': 'teaching-methods',
    'enContent.teachingAndLearningMethods': 'teaching-methods',

    // Literature section
    'deContent.recommendedReading': 'literature',
    'enContent.recommendedReading': 'literature',

    // Particularities section
    'deContent.particularities': 'particularities',
    'enContent.particularities': 'particularities',

    // Prerequisites section
    recommendedPrerequisites: 'prerequisites',
    requiredPrerequisites: 'prerequisites',
    attendanceRequirement: 'prerequisites',
    assessmentPrerequisite: 'prerequisites',

    // Misc section
    participants: 'misc',
    moduleRelation: 'misc',
    taughtWith: 'misc'
  } as const

  // Compile-time check: Ensure every form field has an error-to-section mapping
  // If you add a field to the schema but forget to map it here, you'll get a TypeScript error
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function assertAllFieldsMappedForErrors(): void {
    // This will cause a TypeScript error if any FormFieldPath is missing from fieldToSectionMap
    const allMappedFields: FormFieldPath[] = Object.keys(fieldToSectionMap) as FormFieldPath[]

    // Prevent unused variable warning
    void allMappedFields
  }

  let sectionsWithErrors = $derived.by(() => {
    const errors = $allErrors
    if (!errors) return undefined

    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const sectionsWithErrors = new Set<string>()

    for (const error of errors) {
      const sectionId = fieldToSectionMap[error.path as FormFieldPath]
      if (sectionId) {
        sectionsWithErrors.add(sectionId)
        continue
      }
      if (error.path.includes('.')) {
        const rootField = error.path.split('.')[0]
        const sectionId = fieldToSectionMap[rootField as FormFieldPath]
        if (sectionId) {
          sectionsWithErrors.add(sectionId)
        }
      }
    }

    return Array.from(sectionsWithErrors)
  })

  // handle navigation between sections on mobile layout

  const currentSection = $derived(
    sections.find(({ href }) => page.url.pathname === href) || sections[0]
  )

  function handleSectionChange(event: Event) {
    const target = event.target as HTMLSelectElement
    const selectedHref = target.value
    if (selectedHref) {
      goto(selectedHref)
    }
  }

  // store original form data for comparison
  // svelte-ignore state_referenced_locally
  const originalFormData = structuredClone(data.form.data)

  // deep comparison function to check for actual changes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function hasActualChanges(current: any, original: any): boolean {
    if (current === original) return false

    if (current == null || original == null) {
      return current !== original
    }

    if (typeof current !== typeof original) return true

    if (Array.isArray(current) && Array.isArray(original)) {
      if (current.length !== original.length) return true
      return current.some((item, index) => hasActualChanges(item, original[index]))
    }

    if (typeof current === 'object') {
      const currentKeys = Object.keys(current)
      const originalKeys = Object.keys(original)

      if (currentKeys.length !== originalKeys.length) return true

      return currentKeys.some((key) => hasActualChanges(current[key], original[key]))
    }

    return current !== original
  }

  // prevent leaving the page with unsaved changes
  const hasUnsavedChanges = $derived($tainted)
  const hasChangesToSubmit = $derived(hasActualChanges($formData, originalFormData))

  beforeNavigate(({ to, cancel }) => {
    // prevent navigation during submission
    if ($submitting) {
      if (isReviewMode) {
        return
      }
      cancel()
      return
    }

    if (hasUnsavedChanges && to) {
      const currentModuleBase = `/my-modules/${id}`
      const isWithinModule = to.url.pathname.startsWith(currentModuleBase)

      if (!isWithinModule) {
        if (
          !confirm('Sie haben ungespeicherte Änderungen. Möchten Sie die Seite wirklich verlassen?')
        ) {
          cancel()
        }
      }
    }
  })

  const ERROR_TOOLTIP_TEXT = 'Es befindest sich mindestens ein Fehler in diesem Abschnitt.'

  // error dismissal state
  let showError = $state(true)

  $effect(() => {
    if (page.form?.message) {
      showError = true
    }
  })
</script>

{#snippet submitButton(additionalClasses = '')}
  <Button
    variant={sectionsWithErrors?.length ? 'destructive' : 'default'}
    class="mt-12 w-full {additionalClasses}"
    type="submit"
    disabled={$submitting || !hasChangesToSubmit}
  >
    {#if $submitting}
      <Spinner size="md" class="mr-2" />
      Wird gespeichert...
    {:else if sectionsWithErrors?.length}
      {sectionsWithErrors.length} Fehler
    {:else if !hasChangesToSubmit}
      Keine Änderungen
    {:else}
      Modul aktualisieren
    {/if}
  </Button>
{/snippet}

<div class="w-full max-w-none space-y-8">
  <!-- loading overlay during submission -->
  <LoadingOverlay
    show={$submitting || reviewInProgress}
    message={reviewInProgress
      ? 'Modulprüfung wird verarbeitet…'
      : 'Moduländerungen werden gespeichert…'}
    zIndex={40}
  />

  <!-- Header -->
  <div class="flex items-start justify-between gap-4">
    <div class="min-w-0 flex-1 space-y-2">
      <h1 class="text-3xl font-bold tracking-tight">
        {isReviewMode ? 'Modul prüfen' : 'Modul bearbeiten'}
      </h1>
      <p class="text-muted-foreground wrap-break-word">
        {isReviewMode
          ? 'Prüfen Sie die Modulinformationen. Änderungen können gespeichert werden; die Seite lädt danach neu.'
          : 'Bearbeiten Sie die Modulinformationen und speichern Sie Ihre Änderungen.'}
      </p>
    </div>

    {#if browser && dev}
      <div class="shrink-0">
        <Dialog.Root>
          <Dialog.Trigger
            class="border-input bg-background ring-offset-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex h-9 items-center justify-center rounded-md border px-3 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
          >
            Debug Info
          </Dialog.Trigger>
          <Dialog.Content class="max-h-[80vh] max-w-4xl overflow-hidden">
            <Dialog.Header>
              <Dialog.Title>Debug Information</Dialog.Title>
              <Dialog.Description>
                Form data and validation state for debugging purposes.
              </Dialog.Description>
            </Dialog.Header>
            <div class="max-h-[60vh] overflow-auto p-1">
              <SuperDebug data={$formData} />
            </div>
          </Dialog.Content>
        </Dialog.Root>
      </div>
    {/if}
  </div>

  <!-- Approval Status or Review Summary -->
  <div class="min-w-0 flex-1 lg:max-w-4xl">
    {#if isReviewMode}
      <ModuleReviewSummary reviews={data.reviews} bind:reviewInProgress moduleId={id} />
    {:else}
      <ModuleApprovalStatus approvals={data.approvals} />
    {/if}
  </div>

  <Separator />

  <!-- Error Message Display -->
  {#if page.form?.message && showError}
    <div class="border-destructive/20 bg-destructive/5 rounded-md border p-3">
      <div class="flex items-start justify-between">
        <div class="flex">
          <div class="shrink-0">
            <svg class="text-destructive size-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-2">
            <h3 class="text-destructive text-sm font-medium">
              Fehler beim Aktualisieren des Moduls
            </h3>
            <div class="text-destructive/80 mt-1 text-sm">
              <p>{page.form.message}</p>
            </div>
          </div>
        </div>
        <div class="ml-4 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            class="text-destructive/60 hover:text-destructive size-6 p-0"
            onclick={() => (showError = false)}
            aria-label="Fehlermeldung schließen"
          >
            <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  {/if}

  <form
    method="POST"
    action="/my-modules/{id}"
    use:enhance
    class={$submitting ? 'pointer-events-none opacity-75' : ''}
  >
    <!-- mobile section selector (shown on small screens) -->
    <div class="mb-6 space-y-2 lg:hidden">
      <label for="section-select" class="text-foreground block text-sm font-medium">
        Abschnitt auswählen:
      </label>
      <select
        id="section-select"
        class="border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
        value={`${currentSection.href}${page.url.search}`}
        onchange={handleSectionChange}
      >
        {#each sections as section (section.id)}
          {@const sectionStatus = getSectionStatus(section.id, data.fieldStatuses)}
          {#if sectionsWithErrors?.includes(section.id)}
            <Tooltip.Provider>
              <Tooltip.Root>
                <Tooltip.Trigger>
                  <option value={`${section.href}${page.url.search}`} class="text-destructive"
                    >⚠️ {section.label}</option
                  >
                </Tooltip.Trigger>
                <Tooltip.Content class="z-100 max-w-xs wrap-break-word"
                  >{ERROR_TOOLTIP_TEXT}</Tooltip.Content
                >
              </Tooltip.Root>
            </Tooltip.Provider>
          {:else}
            <option value={`${section.href}${page.url.search}`}>
              {section.label}{sectionStatus === 'needs-review'
                ? ' 👁️'
                : sectionStatus === 'modified'
                  ? ' ✏️'
                  : ''}
            </option>
          {/if}
        {/each}
      </select>
    </div>

    <!-- desktop layout -->
    <div class="flex flex-col lg:flex-row lg:space-y-0 lg:space-x-12">
      <!-- sidebar navigation (hidden on small screens) -->
      <aside class="hidden shrink-0 lg:block lg:w-1/5">
        <div class="sticky top-6 space-y-6">
          <nav class="flex flex-col space-y-1">
            {#each sections as section (section.id)}
              {@const sectionStatus = getSectionStatus(section.id, data.fieldStatuses)}
              <a
                href={`${section.href}${page.url.search}`}
                class={cn(
                  'block h-auto justify-start rounded-md px-3 py-2 font-normal transition-colors',
                  page.url.pathname === section.href
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
              >
                <div class="flex items-center justify-between">
                  <span>
                    {#if sectionsWithErrors?.includes(section.id)}
                      <Tooltip.Provider>
                        <Tooltip.Root>
                          <Tooltip.Trigger>
                            <span class="text-destructive">⚠️ {section.label}</span>
                          </Tooltip.Trigger>
                          <Tooltip.Content class="z-100">{ERROR_TOOLTIP_TEXT}</Tooltip.Content>
                        </Tooltip.Root>
                      </Tooltip.Provider>
                    {:else}
                      {section.label}
                    {/if}
                  </span>
                  {#if sectionStatus}
                    <ModificationIndicator
                      status={sectionStatus}
                      size="sm"
                      iconOnly={true}
                      inline={false}
                    />
                  {/if}
                </div>
              </a>
            {/each}
          </nav>
          {@render submitButton()}
        </div>
      </aside>

      <!-- main content -->
      <div class="min-w-0 flex-1 lg:max-w-3xl">
        <div class="space-y-4 lg:space-y-6">
          {@render children?.()}
        </div>
      </div>
    </div>

    <!-- mobile submit button -->
    {@render submitButton('lg:hidden')}
  </form>
</div>
