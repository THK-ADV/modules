<script lang="ts">
	import { goto } from '$app/navigation'
	import { page } from '$app/state'
	import Button from '$lib/components/ui/button/button.svelte'
	import Separator from '$lib/components/ui/separator/separator.svelte'
	import { routesMap } from '$lib/routes.svelte'
	import { cn } from '$lib/utils'
	import type { LayoutProps } from './$types'

	let { children, data }: LayoutProps = $props()

	routesMap.selectedModule = { id: data.module.id, title: data.module.metadata.title }

	const id = page.params.id

	const sections = [
		{
			id: 'general',
			label: 'Allgemeine Informationen',
			href: `/my-modules/${id}/general`
		},
		{
			id: 'examination',
			label: 'Prüfungsleistungen',
			href: `/my-modules/${id}/examination`
		}
	]
</script>

<div class="space-y-8">
	<!-- Header -->
	<div class="space-y-2">
		<h1 class="text-2xl font-bold tracking-tight">Modul bearbeiten</h1>
		<p class="text-muted-foreground">
			Bearbeiten Sie die Modulinformationen und speichern Sie Ihre Änderungen.
		</p>
	</div>

	<Separator />

	<!-- Sidebar Navigation -->
	<div class="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
		<aside class="lg:w-1/5">
			<nav class="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
				{#each sections as section (section.id)}
					<Button
						variant="ghost"
						class={cn(
							'h-auto justify-start px-3 py-2 font-normal',
							page.url.pathname === section.href
								? 'bg-muted text-foreground'
								: 'text-muted-foreground hover:text-foreground'
						)}
						onclick={() => goto(section.href)}
					>
						{section.label}
					</Button>
				{/each}
			</nav>
		</aside>

		<!-- Main Content -->
		<div class="flex-1 lg:max-w-2xl">
			{@render children?.()}
		</div>
	</div>
</div>
