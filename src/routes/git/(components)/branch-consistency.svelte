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
  import {
    CircleCheck,
    CircleAlert,
    ExternalLink,
    FileExclamationPoint,
    GitBranch,
    RefreshCw,
    Trash2
  } from '@lucide/svelte'
  import { deleteModuleDraft, getBranchConsistency } from '../git.remote'

  const categories = {
    branch: {
      label: 'Branch ohne Entwurf',
      icon: GitBranch,
      deleteLabel: 'Branch löschen',
      class:
        'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300'
    },
    draft: {
      label: 'Entwurf ohne Branch',
      icon: FileExclamationPoint,
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

<div class="space-y-6" aria-busy={refreshing}>
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
            {report.isConsistent
              ? 'Zu jedem Modul-Branch gibt es einen Entwurf und umgekehrt.'
              : 'Die folgenden Einträge sollten geprüft werden.'}
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
    <div
      class="grid grid-cols-2 gap-4 border-t px-5 py-4 sm:grid-cols-[1fr_1fr_auto] sm:items-center sm:px-6"
    >
      <p class="text-muted-foreground text-sm">
        <span class="text-foreground mr-1 font-semibold tabular-nums"
          >{report.moduleBranchCount}</span
        > Modul-Branches
      </p>
      <p class="text-muted-foreground text-sm">
        <span class="text-foreground mr-1 font-semibold tabular-nums"
          >{report.moduleDraftCount}</span
        > Entwürfe
      </p>
      <p class="text-muted-foreground col-span-2 text-xs sm:col-span-1">
        Zuletzt geprüft: <time datetime={report.checkedAt}
          >{dateFormat.format(new Date(report.checkedAt))}</time
        >
      </p>
    </div>
  </section>

  <ErrorMessage bind:message={refreshError} title="Aktualisierung fehlgeschlagen" />

  <Card.Root class="gap-0 overflow-hidden shadow-none">
    <Card.Header class="pb-5">
      <div class="flex items-center gap-2.5">
        <h2 id="branch-issues" class="text-base font-semibold">Abweichungen</h2>
        <Badge variant="secondary" class="tabular-nums">{issues.length}</Badge>
      </div>
    </Card.Header>
    {#if issues.length}
      <Table.Root class="table-fixed" aria-labelledby="branch-issues">
        <Table.Header>
          <Table.Row class="bg-muted/40 hover:bg-muted/40">
            <Table.Head scope="col" class="pl-4 lg:pl-6">Modul</Table.Head>
            <Table.Head scope="col" class="hidden w-56 lg:table-cell">Kategorie</Table.Head>
            <Table.Head scope="col" class="hidden w-48 pr-6 lg:table-cell">
              <span class="sr-only">Aktionen</span>
            </Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each issues as issue (`${issue.kind}:${issue.moduleId}`)}
            <Table.Row>
              <Table.Cell class="py-5 pr-4 pl-4 align-top whitespace-normal lg:pr-2 lg:pl-6">
                <p class="font-medium wrap-anywhere">
                  {issue.title || 'Modultitel nicht verfügbar'}
                </p>
                <p class="text-muted-foreground mt-1 text-xs tabular-nums">
                  {issue.ects !== null
                    ? `${numberFormat.format(issue.ects)} ECTS`
                    : 'ECTS unbekannt'}
                </p>
                <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 lg:hidden">
                  {@render category(issue.kind)}
                  {#if issue.kind === 'branch'}
                    <Button
                      href={issue.branchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="link"
                      size="sm"
                      class="h-auto px-0"
                      aria-label={`${issue.title || 'Modul'}: Branch in GitLab öffnen (neuer Tab)`}
                    >
                      In GitLab <ExternalLink aria-hidden="true" />
                    </Button>
                  {/if}
                  <div class="ml-auto">{@render deleteButton(issue)}</div>
                </div>
              </Table.Cell>
              <Table.Cell class="hidden py-5 align-top whitespace-normal lg:table-cell">
                {@render category(issue.kind)}
              </Table.Cell>
              <Table.Cell class="hidden py-3 pr-6 align-top lg:table-cell">
                <div class="flex items-center justify-end gap-1">
                  {#if issue.kind === 'branch'}
                    <Button
                      href={issue.branchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="ghost"
                      aria-label={`${issue.title || 'Modul'}: Branch in GitLab öffnen (neuer Tab)`}
                    >
                      In GitLab <ExternalLink aria-hidden="true" />
                    </Button>
                  {/if}
                  {@render deleteButton(issue)}
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
            >Alle Modul-Branches und Entwürfe sind einander zugeordnet.</Empty.Description
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

{#snippet deleteButton(issue: Issue)}
  {@const label = categories[issue.kind].deleteLabel}
  <Button
    variant="ghost"
    size="icon"
    class="text-red-700 hover:bg-red-50 hover:text-red-800 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300"
    aria-label={`${issue.title || 'Modul'}: ${label}`}
    title={label}
    onclick={() => openDelete(issue)}
  >
    <Trash2 class="size-4" aria-hidden="true" />
  </Button>
{/snippet}

{#snippet category(kind: Issue['kind'])}
  {@const { label, icon: Icon, class: className } = categories[kind]}
  <Badge variant="outline" class="gap-1.5 {className}">
    <Icon class="size-3.5 shrink-0" aria-hidden="true" />
    {label}
  </Badge>
{/snippet}
