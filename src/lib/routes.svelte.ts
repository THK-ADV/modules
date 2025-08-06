import {
  Book,
  Eye,
  Home,
  Pencil,
  Search,
  Signature,
  Megaphone,
  LifeBuoy,
  type IconProps
} from '@lucide/svelte'
import type { Component } from 'svelte'

export type RouteInfo = {
  name: string
  icon: Component<IconProps, object, ''>
}

export type RoutesMap = Record<string, RouteInfo>

// TODO: a few routes should not appear on the side bar, but should be resolved in the breadcrumb

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

  const secondaryRoutes: RoutesMap = {
    '/help': {
      name: 'Hilfe',
      icon: LifeBuoy
    },
    '/release-notes': {
      name: 'Release Notes',
      icon: Megaphone
    }
  }

  const protectedRoutes = [...Object.keys(managerRoutes), ...Object.keys(pavRoutes)]

  let selectedModule: { id: string; title: string } | undefined = $state(undefined)

  return {
    get defaultRoutes() {
      return defaultRoutes
    },
    get secondaryRoutes() {
      return secondaryRoutes
    },
    get managerRoutes() {
      return managerRoutes
    },
    get pavRoutes() {
      return pavRoutes
    },
    get allRoutes() {
      return { ...defaultRoutes, ...managerRoutes, ...pavRoutes, ...secondaryRoutes }
    },
    get protectedRoutes() {
      return protectedRoutes
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
