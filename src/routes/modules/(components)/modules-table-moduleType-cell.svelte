<script lang="ts" module>
	import type { StudyProgramModuleAssociation } from '$lib/types/module'
	import { CircleFadingPlus, CircleHelp, CirclePlus, type IconProps } from '@lucide/svelte'
	import type { Component } from 'svelte'

	type ModuleType = {
		label: string
		Icon: Component<IconProps, object, ''> | undefined
	}

	function getModuleType(studyPrograms: StudyProgramModuleAssociation[]): ModuleType {
		let mandatory = false
		let elective = false
		for (const s of studyPrograms) {
			if (s.mandatory) {
				mandatory = true
			} else {
				elective = true
			}
		}
		if (mandatory && !elective) {
			return { label: 'Pflichtmodul', Icon: CirclePlus }
		} else if (!mandatory && elective) {
			return { label: 'Wahlmodul', Icon: CircleHelp }
		} else if (mandatory && elective) {
			return { label: 'Als Modul wählbar', Icon: CircleFadingPlus }
		} else {
			return { label: '???', Icon: undefined }
		}
	}
</script>

<script lang="ts">
	let { studyPrograms }: { studyPrograms: StudyProgramModuleAssociation[] } = $props()
	const { label, Icon } = getModuleType(studyPrograms)
</script>

<div class="flex w-[100px] items-center">
	{#if Icon}
		<!-- The flex-shrink-0 will prevent the icon from shrinking if space is limited -->
		<Icon class="mr-2 h-4 w-4 flex-shrink-0 text-muted-foreground" />
	{/if}
	<span>{label}</span>
</div>
