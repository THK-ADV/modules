import { Book, Eye, Home, Pencil, Search, Signature, type IconProps } from '@lucide/svelte'
import type { Component } from 'svelte'

export type RouteInfo = {
  name: string
  icon: Component<IconProps, object, ''>
}

export type RoutesMap = Record<string, RouteInfo>

function createRoutes() {
  const defaultRoutes: RoutesMap = {
    '/': {
      name: 'Home',
      icon: Home
    },
    '/modules': {
      name: 'Modulsuche',
      icon: Search
    },
    '/module-catalogs': {
      name: 'Modulhandbücher',
      icon: Book
    }
  }

  const managerRoutes: RoutesMap = {
    '/my-modules': {
      name: 'Meine Module',
      icon: Pencil
    }
  }

  const pavRoutes: RoutesMap = {
    '/module-approvals': {
      name: 'Änderungsfreigaben',
      icon: Signature
    },
    '/preview': {
      name: 'Vorschau',
      icon: Eye
    }
  }

  let selectedModule: { id: string; title: string } | undefined = $state(undefined)

  return {
    get defaultRoutes() {
      return defaultRoutes
    },
    get managerRoutes() {
      return managerRoutes
    },
    get pavRoutes() {
      return pavRoutes
    },
    get allRoutes() {
      return { ...defaultRoutes, ...managerRoutes, ...pavRoutes }
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
