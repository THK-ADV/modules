export function getSemesterOptions() {
  return [
    { id: '1', label: '1', badge: '1' },
    { id: '2', label: '2', badge: '2' },
    { id: '3', label: '3', badge: '3' },
    { id: '4', label: '4', badge: '4' },
    { id: '5', label: '5', badge: '5' },
    { id: '6', label: '6', badge: '6' },
    { id: '7', label: '7', badge: '7' }
  ]
}

// changes to this affect lib/calendar/filter.ts and routes/modules/+page.svelte
export function getModuleTypeOptions() {
  return [
    { id: 'pm', label: 'Pflichtmodul', badge: 'PM' },
    { id: 'wm', label: 'Wahlmodul', badge: 'WM' }
  ]
}
