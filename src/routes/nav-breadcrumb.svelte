<script lang="ts">
	import { page } from '$app/state'
	import * as Breadcrumb from '$lib/components/ui/breadcrumb'
	import { routesMap } from '$lib/routes.svelte'

	let { allRoutes } = routesMap

	let breadcrumbItems = $state([{ path: '/', name: 'Home', id: 'home' }])

	$effect(() => {
		const path = page.url.pathname
		const items = [{ path: '/', name: 'Home', id: 'home' }]

		if (path !== '/') {
			const pathSegments = path.split('/')
			pathSegments.shift()

			let selectedModule = routesMap.selectedModule

			for (const id of pathSegments) {
				const path = `/${id}`
				let name
				if (path in allRoutes) {
					name = allRoutes[path].name
				} else if (id === selectedModule?.id) {
					name = selectedModule.title
				} else {
					name = '???'
				}
				items.push({ path, name, id })
			}
		}

		breadcrumbItems = items
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
