<script lang="ts" module>
	import type { ModuleDraftState } from '$lib/types/module-draft'
	import {
		CheckCircle,
		CheckSquare,
		Clock,
		Eye,
		GitCommit,
		HelpCircle,
		XCircle,
		type IconProps
	} from '@lucide/svelte'
	import type { Component } from 'svelte'

	function iconForState(state: ModuleDraftState): Component<IconProps, object, ''> {
		switch (state) {
			case 'published':
				return CheckCircle
			case 'valid_for_review':
				return Eye
			case 'valid_for_publication':
				return CheckSquare
			case 'waiting_for_changes':
				return XCircle
			case 'waiting_for_review':
				return Clock
			case 'waiting_for_publication':
				return GitCommit
			case 'unknown':
				return HelpCircle
		}
	}
</script>

<script lang="ts">
	let {
		id,
		deLabel
	}: {
		id: ModuleDraftState
		deLabel: string
	} = $props()
	const Icon = iconForState(id)
</script>

<div class="flex w-[100px] items-center">
	<!-- The flex-shrink-0 will prevent the icon from shrinking if space is limited -->
	<Icon class="mr-2 h-4 w-4 flex-shrink-0 text-muted-foreground" />
	<!-- TODO: revisit labels. 'Veröffentlicht' seems to bit confusing -->
	<!-- TODO: add tooltip -->
	<!-- TODO: add ECTS info to distinguish modules with the same name -->
	<span>{deLabel}</span>
</div>
