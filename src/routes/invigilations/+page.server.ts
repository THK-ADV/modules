import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ parent }) => {
  const { userInfo } = await parent()
  if (!userInfo) error(403, { message: 'Klausuraufsichten sind nur für Beschäftigte sichtbar' })
  return { me: userInfo.person.id }
}
