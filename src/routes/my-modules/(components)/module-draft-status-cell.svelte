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

	function tooltipForState(state: ModuleDraftState): string {
		switch (state) {
			case 'published':
				return 'Das Modul ist veröffentlicht und taucht im Modulhandbuch und in der Modulsuche auf.'
			case 'valid_for_review':
				return 'Das Modul kann zur Genehmigung freigegeben werden. Eine Genehmigung ist erforderlich, da genehmigungspflichtige Attribute geändert wurden.'
			case 'valid_for_publication':
				return 'Das Modul kann veröffentlicht werden. Nach der Bearbeitungsphase taucht es im Modulhandbuch und in der Modulsuche auf.'
			case 'waiting_for_changes':
				return 'Das Modul wurde im Genehmigungsprozess abgelehnt und benötigt Anpassungen.'
			case 'waiting_for_review':
				return 'Das Modul ist im Genehmigungsprozess.'
			case 'waiting_for_publication':
				return 'TODO'
			case 'unknown':
				return 'Unbekannt'
		}
	}
</script>

<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip/index.js'

	let {
		id,
		deLabel
	}: {
		id: ModuleDraftState
		deLabel: string
	} = $props()
	const Icon = iconForState(id)
	const tooltip = tooltipForState(id)
</script>

<Tooltip.Provider>
	<Tooltip.Root>
		<Tooltip.Trigger>
			<div class="flex w-[100px] items-center">
				<!-- The flex-shrink-0 will prevent the icon from shrinking if space is limited -->
				<Icon class="mr-2 h-4 w-4 flex-shrink-0 text-muted-foreground" />
				<!-- TODO: revisit labels. 'Veröffentlicht' seems to bit confusing -->
				<!-- TODO: add ECTS info to distinguish modules with the same name -->
				<span>{deLabel}</span>
			</div>
		</Tooltip.Trigger>
		<!-- long tooltips will wrap properly by word breaking if needed -->
		<Tooltip.Content class="max-w-xs break-words">
			<p class="whitespace-normal">{tooltip}</p>
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
