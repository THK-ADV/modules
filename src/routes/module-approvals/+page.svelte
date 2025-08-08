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
</script>

<div class="flex h-full flex-1 flex-col space-y-8">
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
