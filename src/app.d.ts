import type { BreadcrumbLabels } from '$lib/routes'

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    interface PageData {
      breadcrumbLabels?: BreadcrumbLabels
    }
    // interface PageState {}
    // interface Platform {}
  }
}

export {}
