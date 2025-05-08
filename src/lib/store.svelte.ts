import type { StudyProgram } from '$lib/types/study-program'
import { url } from '$lib/http'
import type { Identity } from '$lib/types/identity'
import type { FilterData } from '../routes/modules/data-table-filter-option.svelte'

function ordinalKind(a: Identity): number {
	switch (a.kind) {
		case 'person':
			return 0
		case 'group':
			return 1
		case 'unknown':
			return 2
	}
}

function peopleOrdering(a: Identity, b: Identity): number {
	if (a.kind === b.kind) {
		if (a.kind === 'person' && b.kind === 'person') {
			return a.lastname.localeCompare(b.lastname)
		} else if (a.kind === 'group' && b.kind === 'group') {
			return a.label.localeCompare(b.label)
		} else {
			return a.id.localeCompare(b.id)
		}
	} else {
		return ordinalKind(a) - ordinalKind(b)
	}
}

function fmtStudyProgram(sp: StudyProgram) {
	const degree = sp.degree.deLabel.charAt(0)
	if (sp.specialization) {
		return `${sp.deLabel} ${sp.specialization.deLabel} (${degree}., PO ${sp.po.version})`
	}
	return `${sp.deLabel} (${degree}., PO ${sp.po.version})`
}

function fmtStudyProgramShort(sp: StudyProgram) {
	const degree = sp.degree.deLabel.charAt(0)
	if (sp.specialization) {
		const spec = sp.specialization.id.split('_').at(-1)?.toUpperCase() ?? sp.specialization.deLabel
		return `${sp.abbreviation} ${spec} ${degree}. ${sp.po.version}`
	}
	return `${sp.abbreviation} ${degree} ${sp.po.version}`
}

function fmtPerson(p: Identity): string {
	switch (p.kind) {
		case 'person':
			return `${p.lastname}, ${p.firstname}`
		case 'group':
			return p.label
		case 'unknown':
			return p.label
	}
}

function fmtPersonShort(p: Identity): string {
	switch (p.kind) {
		case 'person':
			return p.abbreviation
		case 'group':
			return p.id.toUpperCase()
		case 'unknown':
			return p.id.toUpperCase()
	}
}

function createModuleFilter() {
	let studyPrograms = $state.raw(new Array<FilterData>())
	let identities = $state.raw(new Array<FilterData>())
	let semester = $state.raw(new Array<FilterData>())
	let selectedStudyPrograms = $state(new Array<string>())
	let selectedIdentities = $state(new Array<string>())
	let selectedSemester = $state(new Array<string>())

	return {
		get studyPrograms() {
			return studyPrograms
		},
		get identities() {
			return identities
		},
		get semester() {
			return semester
		},
		get selectedStudyPrograms() {
			return selectedStudyPrograms
		},
		get selectedIdentities() {
			return selectedIdentities
		},
		get selectedSemester() {
			return selectedSemester
		},
		selectStudyProgram(id: string) {
			if (selectedStudyPrograms.includes(id)) {
				selectedStudyPrograms = selectedStudyPrograms.filter((x) => x !== id)
			} else {
				selectedStudyPrograms.push(id)
			}
		},
		selectSemester(id: string) {
			if (selectedSemester.includes(id)) {
				selectedSemester = selectedSemester.filter((x) => x !== id)
			} else {
				selectedSemester.push(id)
			}
		},
		selectIdentity(id: string) {
			if (selectedIdentities.includes(id)) {
				selectedIdentities = selectedIdentities.filter((x) => x !== id)
			} else {
				selectedIdentities.push(id)
			}
		},
		clearSelectedStudyPrograms() {
			selectedStudyPrograms = []
		},
		clearSelectedIdentities() {
			selectedIdentities = []
		},
		clearSelectedSemester() {
			selectedSemester = []
		},
		clearSelections() {
			selectedStudyPrograms = []
			selectedIdentities = []
			selectedSemester = []
		},
		async init(fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) {
			if (semester.length === 0) {
				semester = [
					{ id: '1', label: '1', badge: '1' },
					{ id: '2', label: '2', badge: '2' },
					{ id: '3', label: '3', badge: '3' },
					{ id: '4', label: '4', badge: '4' },
					{ id: '5', label: '5', badge: '5' },
					{ id: '6', label: '6', badge: '6' },
					{ id: '7', label: '7', badge: '7' }
				]
			}
			if (studyPrograms.length === 0 || identities.length === 0) {
				const [sp, id] = await Promise.allSettled([
					fetch(url + '/studyPrograms?extend=true'),
					fetch(url + '/identities')
				])
				if (sp.status === 'fulfilled' && sp.value.ok) {
					const xs: StudyProgram[] = await sp.value.json()
					studyPrograms = xs.map((sp) => ({
						label: fmtStudyProgram(sp),
						id: sp.specialization?.id ?? sp.po.id,
						badge: fmtStudyProgramShort(sp)
					}))
				}
				if (id.status === 'fulfilled' && id.value.ok) {
					const xs: Identity[] = await id.value.json()
					xs.sort(peopleOrdering)
					identities = xs.map((id) => ({
						label: fmtPerson(id),
						id: id.id,
						badge: fmtPersonShort(id)
					}))
				}
			}
		}
	}
}

export const moduleFilter = createModuleFilter()
