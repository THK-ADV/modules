import { redirect } from '@sveltejs/kit'

export const load = ({ params }) => {
  // we are reusing the same layout and functionality as when editing a module
  throw redirect(307, `/my-modules/${params.id}/general?mode=review`)
}
