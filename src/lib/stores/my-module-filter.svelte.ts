import type { PaginationState } from '@tanstack/table-core'
import type { Selection } from '../../routes/my-modules/(components)/types'
import { getPaginationFromLocalStorage, setPaginationToLocalStorage } from './local-storage'
import { browser } from '$app/environment'

function getCurrentSelectionFromLocalStorage(): Selection {
  if (!browser) {
    return 'my'
  }
  const value = localStorage.getItem('mmf-current-selection')
  if (value === 'my' || value === 'role' || value === 'all') {
    return value
  }
  return 'my'
}

function setCurrentSelectionToLocalStorage(value: Selection) {
  if (!browser) {
    return
  }
  localStorage.setItem('mmf-current-selection', value)
}

export function createMyModuleFilter() {
  let searchString = $state('')
  let currentSelection = $state(getCurrentSelectionFromLocalStorage())

  const pages = ['10', '25', '40', 'Alle']
  let pagination = $state(getPaginationFromLocalStorage('mmf-pagination', +pages[0]))

  return {
    get searchString() {
      return searchString
    },
    get currentSelection() {
      return currentSelection
    },
    get pagination() {
      return pagination
    },
    get pages() {
      return pages
    },
    set searchString(value: string) {
      searchString = value
    },
    set currentSelection(value: Selection) {
      currentSelection = value
      setCurrentSelectionToLocalStorage(value)
    },
    set pagination(value: PaginationState) {
      pagination = value
      setPaginationToLocalStorage('mmf-pagination', value)
    }
  }
}

export const myModuleFilter = createMyModuleFilter()
