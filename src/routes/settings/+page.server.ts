import type { UserSettings } from '$lib/types/user-settings'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

function defaultUserSettings(): UserSettings {
  return {
    calendarSources: ['HOLIDAYS', 'SEMESTER_PLAN', 'SCHEDULE']
  }
}

export const load: PageServerLoad = async ({ fetch }) => {
  const res = await fetch('/auth-api/userSettings')
  if (res.ok) {
    const userSettings: UserSettings = await res.json()
    return { userSettings }
  }
  if (res.status === 404) {
    return { userSettings: defaultUserSettings() }
  }
  const err = await res
    .json()
    .catch(() => ({ message: 'Fehler beim Laden der Benutzer-Einstellungen' }))
  throw error(res.status, { message: err.message })
}
