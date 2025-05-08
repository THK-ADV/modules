<script lang="ts">
	import { page } from '$app/state'
	import * as Breadcrumb from '$lib/components/ui/breadcrumb'
	import { routes } from '$lib/routes'

	let breadcrumbItems = $state([{ path: '/', name: 'Home', id: 'home' }])

	$effect(() => {
		const path = page.url.pathname
		const items = [{ path: '/', name: 'Home', id: 'home' }]

		if (path !== '/') {
			const pathSegment = path.split('/').pop() || ''
			const { name } =
				routes[path] || pathSegment.charAt(0).toUpperCase() + pathSegment.slice(1) || 'Page'
			items.push({ path, name, id: path.replace(/\//g, '-') || 'current-page' })
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
