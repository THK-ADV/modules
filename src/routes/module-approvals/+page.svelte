<script lang="ts" module>
  import type { ColumnDef } from '@tanstack/table-core'

  const columns: ColumnDef<ReviewRequest>[] = [
    {
      accessorKey: 'title',
      header: 'Modulbezeichnung',
      cell: ({ row }) => {
        const snippet = createRawSnippet<[string]>((getTitle) => {
          const title = getTitle()
          return {
            render: () =>
              `<a href="/modules/${row.original.moduleId}?source=latest" class="hover:underline">${title}</a>`
          }
        })

        return renderSnippet(snippet, `${row.original.moduleTitle} (${row.original.moduleAbbrev})`)
      },
      enableColumnFilter: false
    },
    {
      accessorKey: 'author',
      header: 'Angefragt von',
      cell: ({ row }) => {
        const { firstname, lastname } = row.original.author
        return firstname.length > 0 ? `${lastname}, ${firstname.charAt(0)}.` : lastname
      },
      enableColumnFilter: false
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        return renderComponent(ReviewRequestsStatusCell, {
          status: row.original.status,
          items: row.original.items
        })
      },
      enableColumnFilter: false
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        return renderComponent(ReviewRequestsTableActions, {
          items: row.original.items,
          moduleId: row.original.moduleId
        })
      }
    }
  ]
</script>

<script lang="ts">
  import { browser } from '$app/environment'
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import Button from '$lib/components/ui/button/button.svelte'
  import { renderComponent, renderSnippet } from '$lib/components/ui/data-table'
  import type { ReviewRequest } from '$lib/types/review-request'
  import { ChevronDown, ChevronUp, Info } from '@lucide/svelte'
  import { createRawSnippet } from 'svelte'
  import type { PageProps } from './$types'
  import ReviewKeysExplanation from './(components)/review-keys-explanation.svelte'
  import ReviewRequestsStatusCell from './(components)/review-requests-status-cell.svelte'
  import ReviewRequestsTableActions from './(components)/review-requests-table-actions.svelte'
  import ModuleApprovalsTable from './(components)/review-requests-table.svelte'

  const { data }: PageProps = $props()
  let showReviewKeysExplanation = $state(false)
  let showSuccessMessage = $state<string | null>(null)

  $effect(() => {
    if (browser && page.url.searchParams.has('approved')) {
      showSuccessMessage =
        page.url.searchParams.get('approved') === 'true' ? 'genehmigt' : 'abgelehnt'

      // clean up URL after showing message
      const url = new URL(page.url)
      url.searchParams.delete('approved')
      goto(url.toString(), { replaceState: true, noScroll: true })

      // auto-hide after 5 seconds
      setTimeout(() => {
        showSuccessMessage = null
      }, 5000)
    }
  })
</script>

<div class="flex h-full flex-1 flex-col space-y-8">
  <!-- Success message -->
  {#if showSuccessMessage}
    <div class="rounded-md border border-green-200 bg-green-50 p-4">
      <div class="flex">
        <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clip-rule="evenodd"
          />
        </svg>
        <div class="ml-3 flex-1">
          <h3 class="text-sm font-medium text-green-800">
            Moduländerungen {showSuccessMessage}
          </h3>
        </div>
        <div class="ml-auto pl-3">
          <button
            type="button"
            class="inline-flex rounded-md bg-green-50 p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50"
            onclick={() => (showSuccessMessage = null)}
            aria-label="Meldung schließen"
          >
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  {/if}

  <div class="space-y-2">
    <h2 class="text-3xl font-bold tracking-tight">Änderungsfreigaben</h2>
    <p class="text-sm text-muted-foreground">
      Die folgenden Module benötigen eine Prüfung, bevor sie veröffentlicht werden.
    </p>
    <Button
      variant="ghost"
      size="sm"
      onclick={() => (showReviewKeysExplanation = !showReviewKeysExplanation)}
      class="h-auto p-2 text-sm"
    >
      <Info class="mr-1 h-4 w-4" />
      {showReviewKeysExplanation
        ? 'Erklärung zum Prüfprozess ausblenden'
        : 'Erklärung zum Prüfprozess anzeigen'}
      {#if showReviewKeysExplanation}
        <ChevronUp class="ml-1 h-4 w-4" />
      {:else}
        <ChevronDown class="ml-1 h-4 w-4" />
      {/if}
    </Button>
  </div>

  <ReviewKeysExplanation
    reviewKeys={data.moduleReviewKeys}
    showComponent={showReviewKeysExplanation}
  />

  <ModuleApprovalsTable reviewRequests={data.reviewRequests} {columns} />
</div>
