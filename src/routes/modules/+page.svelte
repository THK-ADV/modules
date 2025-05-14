<script lang="ts" module>
	import { renderComponent, renderSnippet } from '$lib/components/ui/data-table/index.js'
	import type { ModuleView, PersonShort, StudyProgramModuleAssociation } from '$lib/types/module'
	import type { ColumnDef } from '@tanstack/table-core'
	import DataTableTitleButton from './data-table-title-button.svelte'

	const fmtCredits = new Intl.NumberFormat('de-DE', {
		minimumFractionDigits: 0,
		maximumFractionDigits: 1
	})

	function fmtModuleManagement(xs: ReadonlyArray<PersonShort>) {
		let res = ''
		for (const [i, x] of xs.entries()) {
			switch (x.kind) {
				case 'person':
					if (x.firstname.length > 0) {
						res += `${x.lastname}, ${x.firstname.charAt(0)}.`
						if (i < xs.length - 1) {
							res += ' & '
						}
					}
					break
				case 'group':
					res += x.title
					break
				case 'unknown':
					res += x.title
					break
			}
		}
		return res
	}

	function fmtSemester(xs: ReadonlyArray<StudyProgramModuleAssociation>) {
		let semester: number[]
		const res: Record<number, undefined> = {}
		for (const { recommendedSemester } of xs) {
			for (const s of recommendedSemester) {
				res[s] = undefined
			}
		}
		semester = Object.keys(res).map((s) => +s)
		if (semester.length === 0) {
			return '-'
		} else {
			semester.sort()
			return semester.join(', ')
		}
	}

	function fmtStudyPrograms(xs: ReadonlyArray<StudyProgramModuleAssociation>) {
		let res: string[] = []
		for (const { studyProgram } of xs) {
			if (!res.includes(studyProgram.abbreviation)) {
				res.push(studyProgram.abbreviation)
			}
		}
		return res.join(', ')
	}

	export const columns: ColumnDef<ModuleView>[] = [
		{
			accessorKey: 'title',
			header: ({ column }) => {
				return renderComponent(DataTableTitleButton, {
					onclick: column.getToggleSortingHandler()
				})
			},
			cell: ({ row }) => {
				const snippet = createRawSnippet<[string]>((getTitle) => {
					const title = getTitle()
					return {
						render: () => `<a href="/modules/${row.original.id}">${title}</a>`
					}
				})
				return renderSnippet(snippet, row.original.title)
			},
			filterFn: 'includesString'
		},
		{
			accessorKey: 'moduleManagement',
			header: 'Modulverantwortliche',
			cell: ({ row }) => fmtModuleManagement(row.original.moduleManagement),
			filterFn: (row, _, filterValue) => {
				const ids = filterValue as string[]
				if (ids.length === 0) {
					return true
				}
				return row.original.moduleManagement.some(({ id }) => ids.includes(id))
			}
		},
		{
			accessorKey: 'studyProgram',
			header: 'Studiengänge',
			cell: ({ row }) => fmtStudyPrograms(row.original.studyProgram),
			filterFn: (row, _, filterValue) => {
				const pos = filterValue as string[]
				if (pos.length === 0) {
					return true
				}
				return row.original.studyProgram.some((s) => pos.includes(s.studyProgram.po.id))
			}
		},
		{
			accessorKey: 'moduleType',
			header: 'Moduleart',
			cell: ({ row }) => {
				return renderComponent(DataTableModuleTypeCell, {
					studyPrograms: row.original.studyProgram
				})
			},
			enableColumnFilter: false
		},
		{
			accessorKey: 'credits',
			header: 'ECTS',
			cell: ({ row }) => fmtCredits.format(row.original.ects)
		},
		{
			accessorKey: 'semester',
			header: 'Semester',
			cell: ({ row }) => fmtSemester(row.original.studyProgram),
			filterFn: (row, _, filterValue) => {
				const ids = filterValue as string[]
				if (ids.length === 0) {
					return true
				}
				return row.original.studyProgram.some(({ recommendedSemester }) =>
					recommendedSemester.some((s) => ids.some((id) => +id === s))
				)
			}
		}
		// {
		// 	id: 'actions',
		// 	cell: ({ row }) => {
		// 		return renderComponent(DataTableActions, { id: row.original.id })
		// 	}
		// }
	]
</script>

<script lang="ts">
	import { createRawSnippet } from 'svelte'
	import type { PageProps } from './$types'
	import DataTableModuleTypeCell from './data-table-moduleType-cell.svelte'
	import DataTable from './data-table.svelte'

	let { data }: PageProps = $props()
</script>

<div class="flex h-full flex-1 flex-col space-y-8 p-4">
	<div class="space-y-2">
		<h2 class="text-2xl font-bold tracking-tight">Modulbeschreibungen</h2>
		<p class="text-muted-foreground">
			Veröffentlichte Modulbeschreibungen aller Studiengänge der TH Köln am Campus Gummersbach.
		</p>
	</div>
	<DataTable data={data.modules} {columns} />
</div>
