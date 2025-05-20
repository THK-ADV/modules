<script lang="ts">
	import { Separator } from '$lib/components/ui/separator/index.js'
	import * as Sidebar from '$lib/components/ui/sidebar/index.js'
	import { ModeWatcher } from 'mode-watcher'
	import '../app.css'
	import type { LayoutProps } from './$types'
	import AppSidebar from './app-sidebar.svelte'
	import NavBreadcrumb from './nav-breadcrumb.svelte'

	let { children }: LayoutProps = $props()
</script>

<ModeWatcher />

<Sidebar.Provider>
	<AppSidebar />
	<Sidebar.Inset>
		<header
			class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12"
		>
			<div class="flex items-center gap-2 px-4">
				<Sidebar.Trigger class="-ml-1" />
				<Separator orientation="vertical" class="mr-2 h-4" />
				<NavBreadcrumb />
			</div>
		</header>
		<main class="mx-4">
			{@render children?.()}
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>
