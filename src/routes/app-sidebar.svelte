<script lang="ts" module>
	import AudioWaveform from '@lucide/svelte/icons/audio-waveform'
	import Command from '@lucide/svelte/icons/command'
	import GalleryVerticalEnd from '@lucide/svelte/icons/gallery-vertical-end'

	// This is sample data.
	const data = {
		user: {
			name: 'shadcn',
			email: 'm@example.com'
		},
		teams: [
			{
				name: 'Acme Inc',
				logo: GalleryVerticalEnd,
				plan: 'Enterprise'
			},
			{
				name: 'Acme Corp.',
				logo: AudioWaveform,
				plan: 'Startup'
			},
			{
				name: 'Evil Corp.',
				logo: Command,
				plan: 'Free'
			}
		]
	}
</script>

<script lang="ts">
	import NavProjects from './nav-projects.svelte'
	import NavUser from './nav-user.svelte'
	import TeamSwitcher from '$lib/components/team-switcher.svelte'
	import * as Sidebar from '$lib/components/ui/sidebar/index.js'
	import type { ComponentProps } from 'svelte'

	let {
		ref = $bindable(null),
		collapsible = 'icon',
		...restProps
	}: ComponentProps<typeof Sidebar.Root> = $props()
</script>

<Sidebar.Root bind:ref {collapsible} {...restProps}>
	<Sidebar.Header>
		<TeamSwitcher teams={data.teams} />
	</Sidebar.Header>
	<Sidebar.Content>
		<NavProjects />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser user={data.user} />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
