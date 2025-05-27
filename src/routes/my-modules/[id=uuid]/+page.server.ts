import { moduleSchema } from '$lib/schemas/module.js'
import { fail } from '@sveltejs/kit'
import { zod } from 'sveltekit-superforms/adapters'
import { superValidate } from 'sveltekit-superforms/server'
import type { Actions } from './$types.js'

export const actions: Actions = {
  default: async ({ request }) => {
    const form = await superValidate(request, zod(moduleSchema))

    if (!form.valid) {
      return fail(400, { form })
    }

    // Here you would update your module in the database
    console.log('Updating entire module:', form.data)

    // Simulate API call
    try {
      // await updateModuleGeneral(params.id, form.data)
      console.log('Module updated successfully')
    } catch {
      return fail(500, {
        form,
        message: 'Failed to update module'
      })
    }

    return { form }
  }
}
