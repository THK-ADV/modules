import type { RouteId } from '$app/types'

// Reuse dynamic route IDs in load functions to provide request-local labels:
// breadcrumbLabels: { [MODULE_ROUTE_ID]: module.title }
export const MODULE_ROUTE_ID = '/modules/[id=uuid]' satisfies RouteId
export const MY_MODULE_ROUTE_ID = '/my-modules/[id=uuid]' satisfies RouteId
export const PLAN_ROUTE_ID = '/planning/schedule/[draftId]' satisfies RouteId

/**
 * Breadcrumb labels for every rendered page route. Add the exact SvelteKit route ID here whenever
 * a new +page is introduced. Dynamic routes use this label as a fallback and can override it by
 * returning `breadcrumbLabels` from their page or layout load function.
 */
export const routeLabels = {
  '/': 'Home',
  '/modules': 'Modulsuche',
  [MODULE_ROUTE_ID]: 'Modul',
  '/modules/[id=uuid]/history': 'Versionshistorie',
  '/module-catalogs': 'Modulhandbücher',
  '/exam-lists': 'Prüfungslisten',
  '/my-modules': 'Meine Module',
  [MY_MODULE_ROUTE_ID]: 'Modul',
  '/my-modules/[id=uuid]/general': 'Allgemeine Informationen',
  '/my-modules/[id=uuid]/management': 'Verantwortliche',
  '/my-modules/[id=uuid]/examination': 'Prüfungsleistungen',
  '/my-modules/[id=uuid]/workload': 'Workload',
  '/my-modules/[id=uuid]/study-programs': 'Zuordnung zu Studiengängen',
  '/my-modules/[id=uuid]/learning-outcomes': 'Learning Outcomes',
  '/my-modules/[id=uuid]/module-content': 'Modulinhalte',
  '/my-modules/[id=uuid]/teaching-methods': 'Lehr- und Lernmethoden',
  '/my-modules/[id=uuid]/literature': 'Empfohlene Literatur',
  '/my-modules/[id=uuid]/particularities': 'Besonderheiten',
  '/my-modules/[id=uuid]/prerequisites': 'Voraussetzungen',
  '/my-modules/[id=uuid]/misc': 'Sonstige Informationen',
  '/module-approvals': 'Änderungsfreigaben',
  '/module-approvals/[id=uuid]': 'Modul',
  '/studyprogram': 'Studiengang',
  '/schedule': 'Semesterkalender',
  '/planning/schedule': 'Stundenplanung',
  '/planning/exam': 'Prüfungsplanung',
  '/planning/schedule/live': 'Veröffentlichter Stundenplan',
  [PLAN_ROUTE_ID]: 'Stundenplanung',
  '/help': 'Hilfe und Dokumentation',
  '/release-notes': 'Release Notes',
  '/assessment-methods': 'Prüfungsformen',
  '/settings': 'Einstellungen',
  '/privacy': 'Datenschutz'
} as const satisfies Partial<Record<RouteId, string>>

export type BreadcrumbLabels = Partial<Record<keyof typeof routeLabels, string>>

type BreadcrumbItem = { href: string; label: string }

export function createBreadcrumbItems(
  routeId: RouteId | null,
  pathname: string,
  labels?: BreadcrumbLabels
): BreadcrumbItem[] {
  const home: BreadcrumbItem = { href: '/', label: routeLabels['/'] }

  if (pathname === '/') return [home]
  if (!routeId) return [home, { href: pathname, label: 'Seite nicht gefunden' }]

  // Route IDs resolve labels while the concrete URL supplies the clickable hrefs.
  const routeSegments = routeId.split('/').filter(Boolean)
  const pathSegments = pathname.split('/').filter(Boolean)

  if (routeSegments.length !== pathSegments.length) {
    return [home, { href: pathname, label: 'Unbekannte Seite' }]
  }

  const items = [home]
  let cumulativeRouteId = ''
  let cumulativeHref = ''

  for (let index = 0; index < routeSegments.length; index += 1) {
    cumulativeRouteId += `/${routeSegments[index]}`
    cumulativeHref += `/${pathSegments[index]}`

    const currentRouteId = cumulativeRouteId as keyof typeof routeLabels
    const fallbackLabel = routeLabels[currentRouteId]

    if (fallbackLabel) {
      items.push({
        href: cumulativeHref,
        label: labels?.[currentRouteId] ?? fallbackLabel
      })
    }
  }

  if (items.at(-1)?.href !== cumulativeHref) {
    items.push({ href: cumulativeHref, label: 'Unbekannte Seite' })
  }

  return items
}
