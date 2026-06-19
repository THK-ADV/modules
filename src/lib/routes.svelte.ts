import {
  Book,
  Calendar1,
  FileText,
  GraduationCap,
  House,
  LifeBuoy,
  Megaphone,
  Pencil,
  Search,
  Signature,
  CalendarCog,
  CalendarClock,
  type IconProps,
  Settings
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
      icon: House
    },
    '/modules': {
      name: 'Modulsuche',
      icon: Search
    },
    '/module-catalogs': {
      name: 'Modulhandbücher',
      icon: Book
    },
    '/exam-lists': {
      name: 'Prüfungslisten',
      icon: FileText
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
    '/studyprogram': {
      name: 'Studiengang',
      icon: GraduationCap
    }
  }

  const secondaryRoutes: RoutesMap = {
    '/help': {
      name: 'Hilfe und Dokumentation',
      icon: LifeBuoy
    },
    '/release-notes': {
      name: 'Release Notes',
      icon: Megaphone
    }
  }

  const scheduleRoutes: RoutesMap = {
    '/schedule': {
      name: 'Kalender',
      icon: Calendar1
    }
  }

  const planningRoutes: RoutesMap = {
    '/planning/schedule': {
      name: 'Stundenplanung',
      icon: CalendarCog
    },
    '/planning/exam': {
      name: 'Prüfungsplanung',
      icon: CalendarClock
    }
  }

  const planningSubRoutes: RoutesMap = {
    '/planning/schedule/live': {
      name: 'Live-Daten bearbeiten',
      icon: CalendarCog
    }
  }

  const nonNavRoutes: RoutesMap = {
    '/assessment-methods': {
      name: 'Prüfungsformen',
      icon: FileText
    },
    '/settings': {
      name: 'Einstellungen',
      icon: Settings
    }
  }

  // Protected routes require authentication to access
  const protectedRoutes = [
    ...Object.keys(managerRoutes),
    ...Object.keys(pavRoutes),
    ...Object.keys(planningRoutes),
    ...Object.keys(planningSubRoutes),
    '/settings'
  ]

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
    get scheduleRoutes() {
      return scheduleRoutes
    },
    get planningRoutes() {
      return planningRoutes
    },
    get allRoutes() {
      return {
        ...defaultRoutes,
        ...managerRoutes,
        ...pavRoutes,
        ...secondaryRoutes,
        ...scheduleRoutes,
        ...planningRoutes,
        ...planningSubRoutes,
        ...nonNavRoutes
      }
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
