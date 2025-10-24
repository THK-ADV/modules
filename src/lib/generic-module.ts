export interface GenericModule {
  id: string
  title: string
  abbrev: string
}

export async function fetchGenericModules(
  studyProgram: string,
  po: string,
  fetch: typeof globalThis.fetch
): Promise<GenericModule[]> {
  return fetch(`/auth-api/moduleCatalogs/${studyProgram}/${po}/genericModules`).then(
    async (res) => {
      if (res.ok) {
        return await res.json()
      } else {
        const err = await res.json()
        return Promise.reject(err.message || 'Fehler beim Laden von generischen Modulen')
      }
    }
  )
}
