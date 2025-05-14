<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js'
	import { routesMap } from '$lib/routes.svelte'

	const { routes } = routesMap
</script>

<Sidebar.Group>
	<Sidebar.Menu>
		{#each Object.entries(routes) as [path, route] (path)}
			<Sidebar.MenuItem>
				<Sidebar.MenuButton>
					{#snippet child({ props })}
						<a href={path} {...props}>
							<route.icon />
							<span>{route.name}</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
				<Sidebar.MenuBadge>1</Sidebar.MenuBadge>
			</Sidebar.MenuItem>
		{/each}
	</Sidebar.Menu>
</Sidebar.Group>
