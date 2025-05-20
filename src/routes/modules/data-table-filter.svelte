<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js'
	import { Input } from '$lib/components/ui/input/index.js'
	import { moduleFilter } from '$lib/store.svelte'
	import type { ModuleView } from '$lib/types/module'
	import X from '@lucide/svelte/icons/x'
	import type { Table } from '@tanstack/table-core'
	import DataTableFilterOption from './data-table-filter-option.svelte'

	let { table }: { table: Table<ModuleView> } = $props()

	let showReset = $derived.by(() => {
		const tableFilter = table.getColumn('title')?.getFilterValue() as string
		return (
			moduleFilter.selectedStudyPrograms.length > 0 ||
			moduleFilter.selectedIdentities.length > 0 ||
			moduleFilter.selectedSemester.length > 0 ||
			tableFilter
		)
	})

	function setFilterValue(value: string) {
		table.getColumn('title')?.setFilterValue(value)
	}

	function selectModuleManagement(id: string) {
		moduleFilter.selectIdentity(id)
		table.getColumn('moduleManagement')?.setFilterValue(moduleFilter.selectedIdentities)
	}

	function selectSemester(id: string) {
		moduleFilter.selectSemester(id)
		table.getColumn('semester')?.setFilterValue(moduleFilter.selectedSemester)
	}

	function selectStudyProgram(id: string) {
		moduleFilter.selectStudyProgram(id)
		table.getColumn('studyProgram')?.setFilterValue(moduleFilter.selectedStudyPrograms)
	}

	function clearSemester() {
		moduleFilter.clearSelectedSemester()
		table.getColumn('semester')?.setFilterValue(undefined)
	}

	function clearModuleManagement() {
		moduleFilter.clearSelectedIdentities()
		table.getColumn('moduleManagement')?.setFilterValue(undefined)
	}

	function clearStudyProgram() {
		moduleFilter.clearSelectedStudyPrograms()
		table.getColumn('studyProgram')?.setFilterValue(undefined)
	}

	function reset() {
		setFilterValue('')
		clearSemester()
		clearModuleManagement()
		clearStudyProgram()
	}
</script>

<div class="flex flex-1 flex-wrap items-center gap-2">
	<Input
		placeholder="Suche nach Modulbezeichnung..."
		class="h-8 w-[200px] lg:w-[350px]"
		type="search"
		value={table.getColumn('title')?.getFilterValue()?.toString() ?? ''}
		onchange={(e) => setFilterValue(e.currentTarget.value)}
		oninput={(e) => setFilterValue(e.currentTarget.value)}
	/>
	<DataTableFilterOption
		filterValues={moduleFilter.selectedStudyPrograms}
		handleSelect={selectStudyProgram}
		title="Studiengang"
		options={moduleFilter.studyPrograms}
		clearFilters={clearStudyProgram}
	/>
	<DataTableFilterOption
		filterValues={moduleFilter.selectedSemester}
		handleSelect={selectSemester}
		title="Semester"
		options={moduleFilter.semester}
		clearFilters={clearSemester}
	/>
	<DataTableFilterOption
		filterValues={moduleFilter.selectedIdentities}
		handleSelect={selectModuleManagement}
		title="Modulverantwortliche"
		options={moduleFilter.identities}
		clearFilters={clearModuleManagement}
	/>
	{#if showReset}
		<Button onclick={reset} variant="outline" class="h-8 border-2 border-red-200 px-2 lg:px-3">
			Filter
			<X class="ml-2 h-4 w-4" />
		</Button>
	{/if}
</div>
