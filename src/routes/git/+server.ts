import { resolve } from '$app/paths'
import { redirect } from '@sveltejs/kit'

export function GET() {
  redirect(303, resolve('/git/branches'))
}
