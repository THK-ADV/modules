<script lang="ts" module>
	import AudioWaveform from '@lucide/svelte/icons/audio-waveform'
	import Command from '@lucide/svelte/icons/command'
	import GalleryVerticalEnd from '@lucide/svelte/icons/gallery-vertical-end'

	const data = {
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
	import NavMenu from './nav-menu.svelte'
	import NavUserLogin from './nav-user-login.svelte'
	import TeamSwitcher from '$lib/components/team-switcher.svelte'
	import * as Sidebar from '$lib/components/ui/sidebar/index.js'
	import type { ComponentProps } from 'svelte'
	import type { User } from '$lib/keycloak.svelte'

	let {
		ref = $bindable(null),
		collapsible = 'icon',
		user,
		...restProps
	}: ComponentProps<typeof Sidebar.Root> & { user?: User } = $props()
</script>

<Sidebar.Root bind:ref {collapsible} {...restProps}>
	<Sidebar.Header>
		<TeamSwitcher teams={data.teams} />
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMenu {user} />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUserLogin {user} />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
