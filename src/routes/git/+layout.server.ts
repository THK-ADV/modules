import { error } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ parent }) => {
  const { userInfo } = await parent()

  if (!userInfo?.hasCoreDataEditPrivileges) {
    throw error(403, { message: 'Keine Berechtigung für die Git-Verwaltung' })
  }
}
