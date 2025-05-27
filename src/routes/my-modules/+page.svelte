<script lang="ts" module>
	import { renderComponent, renderSnippet } from '$lib/components/ui/data-table/index.js'
	import type { ModuleDraft } from '$lib/types/module-draft'
	import type { ColumnDef } from '@tanstack/table-core'
	import ModuleDraftStatusCell from './(components)/module-draft-status-cell.svelte'
	import ModuleDraftTable from './(components)/module-draft-table.svelte'
	import { createRawSnippet } from 'svelte'
	import ModuleDraftTableActions from './(components)/module-draft-table-actions.svelte'

	const columns: ColumnDef<ModuleDraft>[] = [
		{
			accessorKey: 'title',
			header: 'Modulbezeichnung',
			cell: ({ row }) => {
				const snippet = createRawSnippet<[string]>((getTitle) => {
					const title = getTitle()
					return {
						render: () => `<a href="/modules/${row.original.module.id}?source=latest">${title}</a>`
					}
				})

				let title = row.original.module.title
				let abbrev = row.original.module.abbrev

				if (row.original.moduleDraft) {
					title = row.original.moduleDraft.data.metadata.title
					abbrev = row.original.moduleDraft.data.metadata.abbrev
				}

				return renderSnippet(snippet, `${title} (${abbrev})`)
			},
			enableColumnFilter: false
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: ({ row }) => {
				return renderComponent(ModuleDraftStatusCell, row.original.moduleDraftState)
			},
			enableColumnFilter: false
		},
		{
			id: 'actions',
			cell: ({ row }) => {
				return renderComponent(ModuleDraftTableActions, {
					moduleId: row.original.module.id,
					state: row.original.moduleDraftState.id,
					isPrivilegedForModule: row.original.privilegedForModule,
					onEdit: () => {
						console.log('TODO: onEdit')
					},
					onPublish: () => {
						console.log('TODO: onPublish')
					},
					onRequestReview: () => {
						console.log('TODO: onRequestReview')
					},
					onCancelReview: () => {
						console.log('TODO: onCancelReview')
					},
					onDiscardChanges: () => {
						console.log('TODO: onDiscardChanges')
					},
					onPermissionUpdate: () => {
						console.log('TODO: onPermissionUpdate')
					}
				})
			}
		}
	]
</script>

<script lang="ts">
	import type { PageProps } from './$types'
	let { data }: PageProps = $props()
</script>

<div class="w-full max-w-none space-y-8">
	{#if data.moduleDrafts.length > 0}
		<div class="space-y-2">
			<h2 class="text-2xl font-bold tracking-tight">Meine Module</h2>
			<p class="break-words text-muted-foreground">
				Sie können die folgenden Module bearbeiten und die Änderungen veröffentlichen oder zur
				Genehmigung freigeben. Eine Genehmigung ist nur bei Änderungen bestimmer Attribute
				notwendig.
			</p>
		</div>
		<div class="w-full">
			<ModuleDraftTable moduleDrafts={data.moduleDrafts} {columns} />
		</div>
	{:else}
		<div class="space-y-2">
			<h2 class="text-2xl font-bold tracking-tight">Meine Module</h2>
			<p class="break-words text-muted-foreground">
				Sie werden in keinem Modul als Modulverantwortliche*r geführt oder haben keine zugeteiliten
				Module.
			</p>
		</div>
	{/if}
</div>
