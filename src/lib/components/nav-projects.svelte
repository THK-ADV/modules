<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js'
	import * as Sidebar from '$lib/components/ui/sidebar/index.js'
	import { routes } from '$lib/routes'
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
