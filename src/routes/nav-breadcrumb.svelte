<script lang="ts">
	import { page } from '$app/state'
	import * as Breadcrumb from '$lib/components/ui/breadcrumb'
	import { routesMap } from '$lib/routes.svelte'

	const { routes } = routesMap

	let breadcrumbItems = $state([{ path: '/', name: 'Home', id: 'home' }])

	$effect(() => {
		const path = page.url.pathname
		const items = [{ path: '/', name: 'Home', id: 'home' }]

		if (path !== '/') {
			const pathSegments = path.split('/')
			pathSegments.shift()

			for (const id of pathSegments) {
				const path = `/${id}`
				const name = routes[path]?.name || '???'
				items.push({ path, name, id })
			}
		}

		breadcrumbItems = items
	})

	$effect(() => {
		const module = routesMap.selectedModule
		if (module) {
			for (const item of breadcrumbItems) {
				if (item.id === module.id) {
					item.name = module.title
				}
			}
		}
	})
</script>

<Breadcrumb.Root>
	<Breadcrumb.List>
		{#each breadcrumbItems as item, i (item.id)}
			<!--			<Breadcrumb.Item class="hidden md:block">-->
			<Breadcrumb.Item>
				{#if i === breadcrumbItems.length - 1}
					<Breadcrumb.Page>{item.name}</Breadcrumb.Page>
				{:else}
					<Breadcrumb.Link href={item.path}>{item.name}</Breadcrumb.Link>
				{/if}
			</Breadcrumb.Item>
			{#if i < breadcrumbItems.length - 1}
				<!--				<Breadcrumb.Separator class="hidden md:block" />-->
				<Breadcrumb.Separator />
			{/if}
		{/each}
	</Breadcrumb.List>
</Breadcrumb.Root>
