<script lang="ts">
  import { goto } from '$app/navigation'
  import { resolve } from '$app/paths'
  import ErrorMessage from '$lib/components/error-message.svelte'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import * as Card from '$lib/components/ui/card/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import * as Empty from '$lib/components/ui/empty/index.js'
  import * as Popover from '$lib/components/ui/popover/index.js'
  import * as Select from '$lib/components/ui/select/index.js'
  import * as Table from '$lib/components/ui/table/index.js'
  import { getErrorMessage } from '$lib/errors'
  import { fmtDateTime } from '$lib/formats'
  import { cn } from '$lib/utils'
  import {
    CalendarClock,
    CalendarPlus,
    ClipboardList,
    Eye,
    LoaderCircle,
    Plus,
    SquarePen,
    Trash2
  } from '@lucide/svelte'
  import type { Snippet } from 'svelte'
  import { createExamPlan, deleteExamPlan, getExamPlans } from '../exam-planning.remote'
  import { plural, semesterLabel, semesterOrder, stateBadge } from './exam-planning'
  import RefreshButton from './refresh-button.svelte'

  let { header, canEdit }: { header: Snippet; canEdit: boolean } = $props()

  const data = $derived(await getExamPlans())
  const rows = $derived(
    data.plans
      .map((plan) => ({ ...plan, label: semesterLabel(plan.semester, data.semesters) }))
      .toSorted((a, b) => semesterOrder(b.semester) - semesterOrder(a.semester))
  )
  const published = $derived(rows.filter((row) => row.publishedAt !== null).length)
  const available = $derived(
    data.semesters.filter((s) => !data.plans.some((plan) => plan.semester === s.id)).toReversed()
  )

  let createOpen = $state(false)
  let semester = $state<string>()
  const selectedSemester = $derived(
    available.some((s) => s.id === semester) ? semester : available[0]?.id
  )
  let creating = $state(false)
  let deleting = $state<(typeof rows)[number]>()
  let busyDelete = $state(false)
  let errorMessage = $state<string>()

  async function create() {
    if (creating || !selectedSemester) return
    creating = true
    errorMessage = undefined
    try {
      const id = await createExamPlan(selectedSemester)
      createOpen = false
      await goto(resolve('/planning/exam/[draftId]', { draftId: id }))
    } catch (error) {
      errorMessage = getErrorMessage(error)
    } finally {
      creating = false
    }
  }

  async function remove() {
    if (!deleting || busyDelete) return
    busyDelete = true
    errorMessage = undefined
    try {
      await deleteExamPlan(deleting.id)
    } catch (error) {
      errorMessage = getErrorMessage(error)
    } finally {
      busyDelete = false
      deleting = undefined
    }
  }
</script>

<div class="mx-auto w-full max-w-5xl space-y-8">
  {@render header()}

  <ErrorMessage bind:message={errorMessage} />

  <section
    class="bg-muted/25 flex flex-col gap-5 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
    aria-label="Übersicht"
  >
    <div class="flex items-start gap-3" role="status">
      <div
        class="bg-background flex size-10 shrink-0 items-center justify-center rounded-lg border"
      >
        <CalendarClock class="text-muted-foreground size-5" aria-hidden="true" />
      </div>
      <div class="space-y-1">
        <h2 class="text-lg font-semibold tracking-tight">
          {rows.length
            ? plural(rows.length, 'Prüfungsplan', 'Prüfungspläne')
            : 'Noch kein Prüfungsplan'}
        </h2>
        <p class="text-muted-foreground text-sm">
          {rows.length
            ? `${published} davon im Semesterkalender veröffentlicht`
            : 'Je Semester gibt es einen gemeinsamen Prüfungsplan.'}
        </p>
      </div>
    </div>
    <div class="flex shrink-0 flex-wrap gap-2">
      <RefreshButton
        refresh={() => getExamPlans().refresh()}
        onError={(message) => (errorMessage = message)}
      />
      {#if canEdit}
        <Button variant="outline" href={resolve('/planning/exam/exams')}>
          <ClipboardList aria-hidden="true" />
          Prüfungen verwalten
        </Button>
        <Popover.Root bind:open={createOpen}>
          <Popover.Trigger>
            {#snippet child({ props })}
              <Button {...props} class="shrink-0" disabled={!available.length}>
                <Plus aria-hidden="true" />
                Neuer Prüfungsplan
              </Button>
            {/snippet}
          </Popover.Trigger>
          <Popover.Content align="end" class="w-80 space-y-4">
            <div class="space-y-1">
              <h3 class="text-sm font-semibold">Neuen Prüfungsplan anlegen</h3>
              <p class="text-muted-foreground text-xs">
                Geplant werden die Prüfungen aus den veröffentlichten Prüfungslisten des Semesters.
              </p>
            </div>
            <div class="space-y-1.5">
              <span id="exam-plan-semester" class="text-sm font-medium">Semester</span>
              <Select.Root
                type="single"
                value={selectedSemester}
                onValueChange={(value) => (semester = value)}
              >
                <Select.Trigger class="w-full" aria-labelledby="exam-plan-semester">
                  {selectedSemester ? semesterLabel(selectedSemester, data.semesters) : 'Semester'}
                </Select.Trigger>
                <Select.Content>
                  {#each available as s (s.id)}
                    <Select.Item value={s.id} label={semesterLabel(s.id, data.semesters)} />
                  {/each}
                </Select.Content>
              </Select.Root>
            </div>
            <Button class="w-full" onclick={create} disabled={!selectedSemester}>
              {#if creating}<LoaderCircle class="animate-spin" aria-hidden="true" />{/if}
              Prüfungsplan anlegen
            </Button>
          </Popover.Content>
        </Popover.Root>
      {/if}
    </div>
  </section>

  <Card.Root class="gap-0 overflow-hidden py-0 shadow-none">
    {#if rows.length}
      <Table.Root aria-label="Prüfungspläne">
        <Table.Header>
          <Table.Row class="bg-muted/40 hover:bg-muted/40">
            <Table.Head scope="col" class="pl-6">Semester</Table.Head>
            <Table.Head scope="col" class="hidden md:table-cell">Status</Table.Head>
            <Table.Head scope="col" class="hidden md:table-cell">Zuletzt bearbeitet</Table.Head>
            <Table.Head scope="col" class="pr-6"><span class="sr-only">Aktionen</span></Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each rows as row (row.id)}
            {@const href = resolve('/planning/exam/[draftId]', { draftId: row.id })}
            {@const stateLabel =
              row.publishedAt === null ? 'Nicht veröffentlicht' : 'Veröffentlicht'}
            <Table.Row>
              <Table.Cell class="py-4 pl-6 align-top whitespace-normal">
                <a {href} class="font-medium hover:underline">{row.label}</a>
                <div
                  class="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-2 text-xs md:hidden"
                >
                  {@render badge(row.publishedAt !== null, stateLabel)}
                  {fmtDateTime(row.updatedAt)}
                </div>
              </Table.Cell>
              <Table.Cell class="hidden py-4 align-top md:table-cell">
                {@render badge(row.publishedAt !== null, stateLabel)}
              </Table.Cell>
              <Table.Cell class="text-muted-foreground hidden py-4 align-top text-sm md:table-cell">
                {fmtDateTime(row.updatedAt)}
              </Table.Cell>
              <Table.Cell class="py-2.5 pr-6 text-right align-top">
                <div class="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-8"
                    {href}
                    title={canEdit ? 'Bearbeiten' : 'Ansehen'}
                    aria-label="{row.label} öffnen"
                  >
                    {#if canEdit}<SquarePen aria-hidden="true" />{:else}<Eye
                        aria-hidden="true"
                      />{/if}
                  </Button>
                  {#if canEdit && row.publishedAt === null}
                    <Button
                      variant="ghost"
                      size="icon"
                      class="size-8 text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      title="Löschen"
                      aria-label="{row.label} löschen"
                      onclick={() => (deleting = row)}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  {/if}
                </div>
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    {:else}
      <Empty.Root class="py-10">
        <Empty.Header>
          <Empty.Media variant="icon"><CalendarPlus /></Empty.Media>
          <Empty.Title class="text-sm">Keine Prüfungspläne</Empty.Title>
          <Empty.Description>
            {canEdit
              ? 'Legen Sie einen Prüfungsplan für ein Semester an.'
              : 'Es wurde noch kein Prüfungsplan angelegt.'}
          </Empty.Description>
        </Empty.Header>
      </Empty.Root>
    {/if}
  </Card.Root>
</div>

{#snippet badge(ok: boolean, label: string)}
  <Badge variant="outline" class={cn(ok ? stateBadge.ok : stateBadge.changed)}>{label}</Badge>
{/snippet}

<Dialog.Root open={deleting !== undefined} onOpenChange={(open) => !open && (deleting = undefined)}>
  <Dialog.Content class="sm:max-w-lg">
    <Dialog.Header>
      <Dialog.Title>Prüfungsplan löschen</Dialog.Title>
      <Dialog.Description>
        Der Prüfungsplan für {deleting?.label} und alle seine Termine werden unwiderruflich gelöscht.
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer class="gap-2">
      <Button variant="outline" onclick={() => (deleting = undefined)}>Abbrechen</Button>
      <Button variant="destructive" onclick={remove}>
        {#if busyDelete}<LoaderCircle class="animate-spin" aria-hidden="true" />{:else}<Trash2
            aria-hidden="true"
          />{/if}
        Löschen
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
