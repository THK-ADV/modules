import type { PageServerLoad } from './$types'
import { SELECTED_TAB_COOKIE_NAME } from './+page.svelte'

export const load: PageServerLoad = ({ cookies }) => ({
  selectedTab: cookies.get(SELECTED_TAB_COOKIE_NAME)
})
