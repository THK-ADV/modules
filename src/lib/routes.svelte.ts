import { Book, FolderSearch, Home, type IconProps } from '@lucide/svelte'
import type { Component } from 'svelte'

export type RouteInfo = {
	name: string
	icon: Component<IconProps, object, ''>
}

export type RoutesMap = Record<string, RouteInfo>

function createRoutes() {
	const routes: RoutesMap = {
		'/': {
			name: 'Home',
			icon: Home
		},
		'/modules': {
			name: 'Modulsuche',
			icon: FolderSearch
		},
		'/module-catalogs': {
			name: 'Modulhandbücher',
			icon: Book
		}
	}

	let selectedModule: { id: string; title: string } | undefined = $state(undefined)

	return {
		get routes() {
			return routes
		},
		get selectedModule() {
			return selectedModule
		},
		set selectedModule(m: { id: string; title: string } | undefined) {
			selectedModule = m
		}
	}
}

export const routesMap = createRoutes()
