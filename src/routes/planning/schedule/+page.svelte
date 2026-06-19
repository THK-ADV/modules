<script lang="ts">
  import { buttonVariants } from '$lib/components/ui/button/index.js'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import Button from '$lib/components/ui/button/button.svelte'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js'
  import * as Empty from '$lib/components/ui/empty/index.js'
  import * as Popover from '$lib/components/ui/popover/index.js'
  import * as Select from '$lib/components/ui/select/index.js'
  import * as Table from '$lib/components/ui/table/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import Spinner from '$lib/components/ui/spinner/spinner.svelte'
  import {
    CalendarPlus,
    ChevronDown,
    Ellipsis,
    Plus,
    Radio,
    SquarePen,
    Trash2,
    Upload
  } from '@lucide/svelte'
  import type { PageProps } from './$types'
  import type { Semester } from '$lib/types/semester'
  import { resolve } from '$app/paths'
  import { goto, invalidateAll } from '$app/navigation'
  import {
    createSchedulePlanDraft,
    deleteSchedulePlanDraft,
    publishSchedulePlanDraft
  } from './planning.remote'
  import ErrorMessage from '$lib/components/error-message.svelte'
  import { getErrorMessage } from '$lib/errors'

  const { data }: PageProps = $props()

  type DraftAction = 'publish' | 'delete'

  interface DraftActionTarget {
    action: DraftAction
    id: string
    label: string
  }

  let requestedSemester = $state<string | null>(null)
  let createPlanDraftDialogOpen = $state(false)
  let confirmationDialogOpen = $state(false)
  let actionTarget = $state<DraftActionTarget | null>(null)
  let runningAction = $state<DraftAction | null>(null)
  let errorMessage = $state<string | undefined>(undefined)

  const isMutatingDraft = $derived(runningAction !== null)

  function openConfirmation(action: DraftAction, id: string, label: string) {
    if (isMutatingDraft) return
    actionTarget = { action, id, label }
    confirmationDialogOpen = true
    errorMessage = undefined
  }

  async function confirmDraftAction() {
    if (!actionTarget || isMutatingDraft) return

    const target = actionTarget
    runningAction = target.action
    errorMessage = undefined

    try {
      switch (target.action) {
        case 'publish':
          await publishSchedulePlanDraft(target.id)
          break
        case 'delete':
          await deleteSchedulePlanDraft(target.id)
          break
      }

      confirmationDialogOpen = false
      await invalidateAll()
    } catch (err) {
      confirmationDialogOpen = false
      errorMessage = getErrorMessage(err)
    } finally {
      runningAction = null
    }
  }

  const semestersWithPlanning = $derived(new Set(data.drafts.map((draft) => draft.semester)))
  const availableSemesters = $derived(
    data.semesters.filter((semester) => !semestersWithPlanning.has(semester.id))
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
            {#each availableSemesters as semester (semester.id)}
              {@const label = semesterLabel(semester)}
              <Select.Item value={semester.id} {label}>{label}</Select.Item>
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

  <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div class="min-w-0 space-y-2">
      <h2 class="text-3xl font-bold tracking-tight">Stundenplanung</h2>
      <p class="text-muted-foreground text-sm">
        Planungen verwalten, eine neue Planung beginnen oder die Live-Daten bearbeiten.
      </p>
    </div>

    <div class="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
      <Button href={resolve('/planning/schedule/live')} variant="outline">
        <Radio class="size-4" />
        Live-Daten bearbeiten
      </Button>

      <Tooltip.Provider>
        <Tooltip.Root disabled={!unavailablePlanningMessage}>
          <Tooltip.Trigger class="inline-flex">
            {#snippet child({ props })}
              <span {...props} class="inline-flex w-full">
                <Popover.Root bind:open={createPlanDraftDialogOpen}>
                  <Popover.Trigger
                    class={buttonVariants({ variant: 'default', class: 'w-full' })}
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

  <!-- Plan drafts -->
  <section>
    {#if data.drafts.length === 0}
      <Empty.Root class="border">
        <Empty.Header>
          <Empty.Media variant="icon">
            <CalendarPlus />
          </Empty.Media>
          <Empty.Title>Keine Planungen</Empty.Title>
        </Empty.Header>
      </Empty.Root>
    {:else}
      <div class="overflow-hidden rounded-lg border">
        <Table.Root>
          <Table.Header>
            <Table.Row class="bg-muted/40 hover:bg-muted/40">
              <Table.Head>Semester</Table.Head>
              <Table.Head>Status</Table.Head>
              <Table.Head class="hidden sm:table-cell">Zuletzt bearbeitet</Table.Head>
              <Table.Head class="w-0 text-right">
                <span class="sr-only">Aktionen</span>
              </Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each data.drafts as draft (draft.id)}
              <Table.Row>
                <Table.Cell class="font-medium">
                  <span>{draft.semesterLabel}</span>
                  <span class="text-muted-foreground mt-1 block text-xs font-normal sm:hidden">
                    Zuletzt bearbeitet: {draft.updatedAtLabel}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  {#if draft.publishedAt !== null}
                    <Badge
                      variant="outline"
                      class="border-green-500/50 bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300"
                    >
                      Veröffentlicht
                    </Badge>
                  {:else}
                    <Badge variant="secondary">Unveröffentlicht</Badge>
                  {/if}
                </Table.Cell>
                <Table.Cell class="text-muted-foreground hidden text-sm sm:table-cell">
                  {draft.updatedAtLabel}
                </Table.Cell>
                <Table.Cell class="w-0 text-right">
                  {#if draft.publishedAt === null}
                    <div class="hidden items-center justify-end gap-2 lg:flex">
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
                        class="border-green-400 font-medium text-green-600 shadow-sm transition-colors hover:bg-green-50 hover:text-green-700 dark:border-green-500/50 dark:text-green-400 dark:hover:bg-green-950/40 dark:hover:text-green-300"
                        disabled={isMutatingDraft}
                        onclick={() => openConfirmation('publish', draft.id, draft.semesterLabel)}
                      >
                        {#if runningAction === 'publish' && actionTarget?.id === draft.id}
                          <Spinner size="sm" />
                        {:else}
                          <Upload class="size-4" />
                        {/if}
                        Planung veröffentlichen
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        class="border-red-300 font-medium text-red-700 shadow-sm transition-colors hover:bg-red-50 hover:text-red-800 dark:border-red-500/50 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                        disabled={isMutatingDraft}
                        onclick={() => openConfirmation('delete', draft.id, draft.semesterLabel)}
                      >
                        {#if runningAction === 'delete' && actionTarget?.id === draft.id}
                          <Spinner size="sm" />
                        {:else}
                          <Trash2 class="size-4" />
                        {/if}
                        Planung löschen
                      </Button>
                    </div>

                    <div class="flex justify-end lg:hidden">
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger>
                          {#snippet child({ props })}
                            <Button
                              {...props}
                              variant="outline"
                              size="sm"
                              class="size-8 p-0 shadow-sm"
                              disabled={isMutatingDraft}
                            >
                              <span class="sr-only">Aktionen für {draft.semesterLabel} öffnen</span>
                              <Ellipsis class="size-4" />
                            </Button>
                          {/snippet}
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content align="end" class="w-60">
                          <DropdownMenu.Group>
                            <DropdownMenu.GroupHeading>Planungsaktionen</DropdownMenu.GroupHeading>
                            <DropdownMenu.Item
                              class="font-medium text-blue-600 focus:text-blue-700 dark:text-blue-400 dark:focus:text-blue-300"
                              onclick={() =>
                                goto(
                                  resolve('/planning/schedule/[draftId]', {
                                    draftId: draft.id
                                  })
                                )}
                            >
                              <SquarePen class="size-4" />
                              Planung fortsetzen
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              class="font-medium text-green-600 focus:text-green-700 dark:text-green-400 dark:focus:text-green-300"
                              disabled={isMutatingDraft}
                              onclick={() =>
                                openConfirmation('publish', draft.id, draft.semesterLabel)}
                            >
                              <Upload class="size-4" />
                              Planung veröffentlichen
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              class="font-medium text-red-600 focus:text-red-700 dark:text-red-400 dark:focus:text-red-300"
                              disabled={isMutatingDraft}
                              onclick={() =>
                                openConfirmation('delete', draft.id, draft.semesterLabel)}
                            >
                              <Trash2 class="size-4" />
                              Planung löschen
                            </DropdownMenu.Item>
                          </DropdownMenu.Group>
                        </DropdownMenu.Content>
                      </DropdownMenu.Root>
                    </div>
                  {:else}
                    <span
                      class="text-muted-foreground text-sm"
                      aria-label="Keine Aktionen verfügbar">—</span
                    >
                  {/if}
                </Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      </div>
    {/if}
  </section>
</div>

<Dialog.Root bind:open={confirmationDialogOpen}>
  <Dialog.Content showClose={!isMutatingDraft}>
    {#if actionTarget}
      <Dialog.Header>
        <Dialog.Title>
          {actionTarget.action === 'publish' ? 'Planung veröffentlichen?' : 'Planung löschen?'}
        </Dialog.Title>
        <Dialog.Description>
          {#if actionTarget.action === 'publish'}
            Sind Sie sicher, dass Sie die Planung für {actionTarget.label} veröffentlichen möchten? Nach
            der Veröffentlichung kann die Planung nicht mehr bearbeitet werden.
          {:else}
            Sind Sie sicher, dass Sie die Planung für {actionTarget.label} löschen möchten? Alle Entwurfstermine
            werden unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
          {/if}
        </Dialog.Description>
      </Dialog.Header>
      <Dialog.Footer class="gap-2 sm:gap-0">
        <Button
          variant="outline"
          disabled={isMutatingDraft}
          onclick={() => (confirmationDialogOpen = false)}>Abbrechen</Button
        >
        <Button
          variant={actionTarget.action === 'delete' ? 'destructive' : 'default'}
          disabled={isMutatingDraft}
          onclick={confirmDraftAction}
        >
          {#if runningAction === 'publish'}
            <Spinner size="sm" />
            Wird veröffentlicht…
          {:else if runningAction === 'delete'}
            <Spinner size="sm" />
            Wird gelöscht…
          {:else if actionTarget.action === 'publish'}
            <Upload class="size-4" />
            Planung veröffentlichen
          {:else}
            <Trash2 class="size-4" />
            Planung löschen
          {/if}
        </Button>
      </Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>
