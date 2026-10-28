<script lang="ts">
  import ErrorMessage from '$lib/components/error-message.svelte'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import * as Card from '$lib/components/ui/card/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import * as Empty from '$lib/components/ui/empty/index.js'
  import Spinner from '$lib/components/ui/spinner/spinner.svelte'
  import * as Table from '$lib/components/ui/table/index.js'
  import { getErrorMessage } from '$lib/errors'
  import { TIME_ZONE } from '$lib/formats'
  import { CircleCheck, CircleAlert, ExternalLink, RefreshCw, Trash2 } from '@lucide/svelte'
  import { deleteModuleDraft, getBranchConsistency } from '../branches.remote'

  const categories = {
    branch: {
      label: 'Branch ohne Entwurf',
      deleteLabel: 'Branch löschen',
      class:
        'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300'
    },
    draft: {
      label: 'Entwurf ohne Branch',
      deleteLabel: 'Entwurf löschen',
      class:
        'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-400/25 dark:bg-sky-400/10 dark:text-sky-300'
    }
  } as const

  let report = $state(await getBranchConsistency())
  const issues = $derived(
    [
      ...report.branchesWithoutDraft.map((branch) => ({ ...branch, kind: 'branch' as const })),
      ...report.draftsWithoutBranch.map((draft) => ({ ...draft, kind: 'draft' as const }))
    ].toSorted((a, b) => (a.title ?? '').localeCompare(b.title ?? '', 'de'))
  )
  type Issue = (typeof issues)[number]

  let refreshing = $state(false)
  let refreshError = $state<string>()
  let deleting = $state<Issue>()
  let deleteError = $state<string>()
  let removing = $state(false)

  const numberFormat = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 })
  const dateFormat = new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: TIME_ZONE
  })

  async function refresh() {
    if (refreshing) return
    refreshing = true
    refreshError = undefined
    try {
      await getBranchConsistency().refresh()
      report = await getBranchConsistency()
    } catch (error) {
      refreshError = getErrorMessage(error)
    } finally {
      refreshing = false
    }
  }

  function openDelete(issue: Issue) {
    deleteError = undefined
    deleting = issue
  }

  async function confirmDelete() {
    if (!deleting || removing) return
    removing = true
    deleteError = undefined
    try {
      await deleteModuleDraft(deleting.moduleId)
      report = await getBranchConsistency()
      deleting = undefined
    } catch (error) {
      deleteError = getErrorMessage(error)
    } finally {
      removing = false
    }
  }
</script>

<div class="space-y-8" aria-busy={refreshing}>
  <section class="bg-muted/25 rounded-xl border" aria-label="Ergebnis des Abgleichs">
    <div class="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div class="flex items-start gap-3" role="status" aria-live="polite" aria-atomic="true">
        <div
          class="bg-background flex size-10 shrink-0 items-center justify-center rounded-lg border"
        >
          {#if report.isConsistent}
            <CircleCheck class="size-5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
          {:else}
            <CircleAlert class="size-5 text-amber-700 dark:text-amber-400" aria-hidden="true" />
          {/if}
        </div>
        <div class="space-y-1">
          <h2 class="text-lg font-semibold tracking-tight">
            {report.isConsistent
              ? 'Branches und Entwürfe sind konsistent'
              : `${issues.length} ${issues.length === 1 ? 'Abweichung' : 'Abweichungen'} gefunden`}
          </h2>
          <p class="text-muted-foreground text-sm">
            Zuletzt geprüft:
            <time class="text-foreground" datetime={report.checkedAt}
              >{dateFormat.format(new Date(report.checkedAt))}</time
            >
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        onclick={refresh}
        aria-disabled={refreshing}
        class="shrink-0 aria-disabled:opacity-50"
      >
        <RefreshCw class={refreshing ? 'motion-safe:animate-spin' : ''} aria-hidden="true" />
        {refreshing ? 'Wird geprüft …' : 'Erneut prüfen'}
      </Button>
    </div>
  </section>

  <ErrorMessage bind:message={refreshError} title="Aktualisierung fehlgeschlagen" />

  <Card.Root class="gap-0 overflow-hidden shadow-none">
    <Card.Header class="pb-5">
      <h2 id="branch-issues" class="text-base font-semibold">Abweichungen</h2>
    </Card.Header>
    {#if issues.length}
      <Table.Root class="table-fixed" aria-labelledby="branch-issues">
        <Table.Header>
          <Table.Row class="bg-muted/40 hover:bg-muted/40">
            <Table.Head scope="col" class="pl-4 lg:pl-6">Modul</Table.Head>
            <Table.Head scope="col" class="hidden w-48 md:table-cell">Kategorie</Table.Head>
            <Table.Head scope="col" class="w-24 pr-4 lg:w-40 lg:pr-6">
              <span class="sr-only">Aktionen</span>
            </Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each issues as issue (`${issue.kind}:${issue.moduleId}`)}
            {@const label = issue.title || 'Modultitel nicht verfügbar'}
            <Table.Row>
              <Table.Cell class="py-4 pl-4 align-top whitespace-normal lg:pl-6">
                <p class="font-medium wrap-anywhere">
                  {label}
                  {#if issue.ects !== null}
                    <span class="text-muted-foreground font-normal tabular-nums"
                      >· {numberFormat.format(issue.ects)} ECTS</span
                    >
                  {/if}
                </p>
                <div class="mt-2 md:hidden">{@render category(issue.kind)}</div>
              </Table.Cell>
              <Table.Cell class="hidden py-4 align-top md:table-cell">
                {@render category(issue.kind)}
              </Table.Cell>
              <Table.Cell class="py-2.5 pr-4 align-top lg:pr-6">
                <div class="flex items-center justify-end gap-1">
                  {#if issue.kind === 'branch'}
                    <Button
                      href={issue.branchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="ghost"
                      size="sm"
                      aria-label={`${label}: Branch in GitLab öffnen (neuer Tab)`}
                    >
                      <ExternalLink aria-hidden="true" />
                      <span class="hidden lg:inline">GitLab</span>
                    </Button>
                  {/if}
                  <Button
                    variant="ghost"
                    size="sm"
                    class="text-red-700 hover:bg-red-50 hover:text-red-800 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                    aria-label={`${label}: ${categories[issue.kind].deleteLabel}`}
                    onclick={() => openDelete(issue)}
                  >
                    <Trash2 aria-hidden="true" />
                    <span class="hidden lg:inline">Löschen</span>
                  </Button>
                </div>
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    {:else}
      <Empty.Root class="border-t py-8 md:py-10">
        <Empty.Header>
          <CircleCheck class="text-muted-foreground mx-auto size-5" aria-hidden="true" />
          <Empty.Title class="text-sm">Keine Abweichungen</Empty.Title>
          <Empty.Description
            >Zu jedem Modul-Branch gibt es einen Entwurf und umgekehrt.</Empty.Description
          >
        </Empty.Header>
      </Empty.Root>
    {/if}
  </Card.Root>
</div>

<Dialog.Root
  open={deleting !== undefined}
  onOpenChange={(open) => {
    if (!open && !removing) deleting = undefined
  }}
>
  <Dialog.Content showClose={!removing} class="sm:max-w-lg">
    {#if deleting}
      <Dialog.Header>
        <Dialog.Title>{categories[deleting.kind].deleteLabel}?</Dialog.Title>
        <Dialog.Description>
          {#if deleting.kind === 'branch'}
            Die Branch <code class="font-mono text-xs">{deleting.branchName}</code> zu „{deleting.title ||
              'Modultitel nicht verfügbar'}“ wird in GitLab unwiderruflich gelöscht. Nicht
            zusammengeführte Änderungen gehen verloren.
          {:else}
            Der Entwurf „{deleting.title || 'Modultitel nicht verfügbar'}“ wird unwiderruflich
            gelöscht, einschließlich Merge Request und Reviews.
          {/if}
        </Dialog.Description>
      </Dialog.Header>
      <ErrorMessage bind:message={deleteError} />
      <Dialog.Footer class="gap-2">
        <Button variant="outline" disabled={removing} onclick={() => (deleting = undefined)}>
          Abbrechen
        </Button>
        <Button variant="destructive" disabled={removing} onclick={confirmDelete}>
          {#if removing}
            <Spinner size="sm" />
          {:else}
            <Trash2 class="size-4" aria-hidden="true" />
          {/if}
          {categories[deleting.kind].deleteLabel}
        </Button>
      </Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>

{#snippet category(kind: Issue['kind'])}
  {@const { label, class: className } = categories[kind]}
  <Badge variant="outline" class={className}>{label}</Badge>
{/snippet}
