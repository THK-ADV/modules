import type { Component } from 'svelte'
import { Book, FolderSearch, Home, type IconProps } from '@lucide/svelte'

export type RouteInfo = {
	name: string
	icon: Component<IconProps, object, ''>
}

export type RoutesMap = Record<string, RouteInfo>

export const routes: RoutesMap = {
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
