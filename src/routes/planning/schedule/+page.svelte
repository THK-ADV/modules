<script lang="ts">
  import { buttonVariants } from '$lib/components/ui/button/index.js'
  import Button from '$lib/components/ui/button/button.svelte'
  import * as Empty from '$lib/components/ui/empty/index.js'
  import * as Popover from '$lib/components/ui/popover/index.js'
  import * as Select from '$lib/components/ui/select/index.js'
  import * as Table from '$lib/components/ui/table/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import Spinner from '$lib/components/ui/spinner/spinner.svelte'
  import { CalendarPlus, ChevronDown, Plus, Radio, SquarePen, Trash2 } from '@lucide/svelte'
  import type { PageProps } from './$types'
  import type { Semester } from '$lib/types/semester'
  import { resolve } from '$app/paths'
  import { invalidateAll } from '$app/navigation'
  import { createSchedulePlanDraft, deleteSchedulePlanDraft } from './planning.remote'
  import ErrorMessage from '$lib/components/error-message.svelte'
  import { getErrorMessage } from '$lib/errors'

  const { data }: PageProps = $props()

  // Creating
  let requestedSemester = $state<string | null>(null)
  let createPlanDraftDialogOpen = $state(false)
  // Deleting
  let deletingDraftId = $state<string | null>(null)
  // Error
  let errorMessage = $state<string | undefined>(undefined)

  async function deleteDraft(draftId: string, draftLabel: string) {
    if (deletingDraftId !== null) return
    if (
      !confirm(
        `Planung für ${draftLabel} löschen? Alle Entwurfstermine werden unwiderruflich gelöscht.`
      )
    ) {
      return
    }

    deletingDraftId = draftId

    try {
      await deleteSchedulePlanDraft(draftId)
      await invalidateAll()
    } catch (err) {
      errorMessage = getErrorMessage(err)
    } finally {
      deletingDraftId = null
    }
  }

  const semestersWithActiveDraft = $derived(new Set(data.drafts.map((draft) => draft.semester)))
  const availableSemesters = $derived(
    data.semesters.filter((semester) => !semestersWithActiveDraft.has(semester.id))
  )
  const unavailablePlanningMessage = $derived(
    data.semesters.length === 0
      ? 'Keine planbaren Semester verfügbar.'
      : availableSemesters.length === 0
        ? 'Alle Planungen existieren bereits.'
        : null
  )
  const selectedSemester = $derived.by(() => {
    if (
      requestedSemester &&
      availableSemesters.some((semester) => semester.id === requestedSemester)
    ) {
      return requestedSemester
    }

    return availableSemesters[0]?.id ?? ''
  })

  const selectedSemesterLabel = $derived.by(() => {
    const semester = availableSemesters.find((s) => s.id === selectedSemester)
    return semester ? semesterLabel(semester) : 'Semester auswählen'
  })

  function semesterLabel(semester: Semester): string {
    return `${semester.deLabel} ${semester.year}`
  }
</script>

{#snippet createPlanDraftContent(closePopover: () => void)}
  <Popover.Content align="end" class="w-80">
    <form
      {...createSchedulePlanDraft.enhance(async ({ submit }) => {
        if (await submit()) {
          closePopover()
        }
      })}
      class="space-y-4"
    >
      <div class="space-y-1">
        <h3 class="text-sm font-semibold tracking-tight">Neue Planung beginnen</h3>
        <p class="text-muted-foreground text-xs">
          Wählen Sie ein Semester, für das ein leerer Planungsstand angelegt wird.
        </p>
      </div>

      <div class="space-y-1.5">
        <span class="text-sm font-medium">Semester</span>
        <Select.Root
          type="single"
          value={selectedSemester}
          onValueChange={(value) => (requestedSemester = value)}
        >
          <Select.Trigger class="w-full" disabled={!selectedSemester}>
            {selectedSemesterLabel}
          </Select.Trigger>
          <Select.Content>
            {#each data.semesters as semester (semester.id)}
              {@const label = semesterLabel(semester)}
              {@const hasActiveDraft = semestersWithActiveDraft.has(semester.id)}
              <Select.Item value={semester.id} {label} disabled={hasActiveDraft}>
                {label}
                {#if hasActiveDraft}
                  <span class="text-muted-foreground"> (Planung läuft)</span>
                {/if}
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>

      {#if selectedSemester}
        <input {...createSchedulePlanDraft.fields.semester.as('hidden', selectedSemester)} />
      {/if}

      <Button
        type="submit"
        class="w-full"
        disabled={!selectedSemester || createSchedulePlanDraft.pending > 0}
      >
        {createSchedulePlanDraft.pending > 0 ? 'Wird angelegt…' : 'Planung starten'}
      </Button>
    </form>
  </Popover.Content>
{/snippet}

<div class="flex h-full flex-1 flex-col space-y-8">
  <ErrorMessage bind:message={errorMessage} />

  <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div class="space-y-2">
      <h2 class="text-3xl font-bold tracking-tight">Stundenplanung</h2>
      <p class="text-muted-foreground text-sm">
        Laufende Planungen verwalten, eine neue beginnen oder die Live-Daten bearbeiten.
      </p>
    </div>

    <div class="flex shrink-0 items-center gap-2">
      <Button href={resolve('/planning/schedule/live')} variant="outline">
        <Radio class="size-4" />
        Live-Daten bearbeiten
      </Button>

      <Tooltip.Provider>
        <Tooltip.Root disabled={!unavailablePlanningMessage}>
          <Tooltip.Trigger class="inline-flex">
            {#snippet child({ props })}
              <span {...props} class="inline-flex">
                <Popover.Root bind:open={createPlanDraftDialogOpen}>
                  <Popover.Trigger
                    class={buttonVariants({ variant: 'default' })}
                    disabled={!selectedSemester}
                  >
                    <Plus class="size-4" />
                    Neue Planung
                    <ChevronDown class="size-4 opacity-70" />
                  </Popover.Trigger>
                  {@render createPlanDraftContent(() => (createPlanDraftDialogOpen = false))}
                </Popover.Root>
              </span>
            {/snippet}
          </Tooltip.Trigger>
          {#if unavailablePlanningMessage}
            <Tooltip.Content>{unavailablePlanningMessage}</Tooltip.Content>
          {/if}
        </Tooltip.Root>
      </Tooltip.Provider>
    </div>
  </div>

  <!-- Active drafts -->
  <section class="space-y-3">
    <h3 class="font-semibold tracking-tight">Laufende Planungen</h3>

    {#if data.drafts.length === 0}
      <Empty.Root class="border">
        <Empty.Header>
          <Empty.Media variant="icon">
            <CalendarPlus />
          </Empty.Media>
          <Empty.Title>Keine laufende Planung</Empty.Title>
          <Empty.Description>
            Es gibt derzeit keine unveröffentlichten Entwürfe. Beginnen Sie eine neue
            Semesterplanung.
          </Empty.Description>
        </Empty.Header>
      </Empty.Root>
    {:else}
      <div class="overflow-hidden rounded-lg border">
        <Table.Root>
          <Table.Header>
            <Table.Row class="bg-muted/40 hover:bg-muted/40">
              <Table.Head>Semester</Table.Head>
              <Table.Head>Zuletzt bearbeitet</Table.Head>
              <Table.Head class="w-0">
                <span class="sr-only">Aktionen</span>
              </Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each data.drafts as draft (draft.id)}
              <Table.Row>
                <Table.Cell class="font-medium">{draft.semesterLabel}</Table.Cell>
                <Table.Cell class="text-muted-foreground text-sm">
                  {draft.updatedAtLabel}
                </Table.Cell>
                <Table.Cell class="text-right">
                  <div
                    class="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end"
                  >
                    <Button
                      href={resolve('/planning/schedule/[draftId]', { draftId: draft.id })}
                      variant="outline"
                      size="sm"
                      class="border-blue-400 font-medium text-blue-600 shadow-sm transition-colors hover:bg-blue-50 hover:text-blue-700 dark:border-blue-500/50 dark:text-blue-400 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
                    >
                      <SquarePen class="size-4" />
                      Planung fortsetzen
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      class="border-red-300 font-medium text-red-700 shadow-sm transition-colors hover:bg-red-50 hover:text-red-800 dark:border-red-500/50 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                      disabled={deletingDraftId !== null}
                      onclick={() => deleteDraft(draft.id, draft.semesterLabel)}
                    >
                      {#if deletingDraftId === draft.id}
                        <Spinner size="sm" />
                      {:else}
                        <Trash2 class="size-4" />
                      {/if}
                      Planung löschen
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      </div>
    {/if}
  </section>
</div>
