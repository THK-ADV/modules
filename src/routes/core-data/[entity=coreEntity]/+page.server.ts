import { getCoreDataEntity } from '$lib/core-data/entities'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, parent }) => {
  const { userInfo } = await parent()

  if (!userInfo?.hasCoreDataEditPrivileges) {
    throw error(403, { message: 'Keine Berechtigung für die Stammdatenpflege' })
  }

  const entity = getCoreDataEntity(params.entity)!
  return { breadcrumbLabels: { '/core-data/[entity=coreEntity]': entity.label } }
}
