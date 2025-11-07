import type { Identity, ModuleCore, ModuleManagement } from './types/core'
import type { StudyProgram } from './types/study-program'

export function ordinalKind(a: Identity): number {
  switch (a.kind) {
    case 'person':
      return 0
    case 'group':
      return 1
    case 'unknown':
      return 2
  }
}

export function peopleOrdering(a: Identity, b: Identity): number {
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

export function fmtStudyProgram(sp: StudyProgram) {
  const degree = sp.degree.deLabel.charAt(0)
  if (sp.specialization) {
    return `${sp.deLabel} ${sp.specialization.deLabel} (${degree}., PO ${sp.po.version})`
  }
  return `${sp.deLabel} (${degree}., PO ${sp.po.version})`
}

export function fmtStudyProgramShort(sp: StudyProgram) {
  const degree = sp.degree.deLabel.charAt(0)
  if (sp.specialization) {
    const spec = sp.specialization.id.split('_').at(-1)?.toUpperCase() ?? sp.specialization.deLabel
    return `${sp.abbreviation} ${spec} ${degree}. ${sp.po.version}`
  }
  return `${sp.abbreviation} ${degree} ${sp.po.version}`
}

export function fmtPerson(p: Identity): string {
  switch (p.kind) {
    case 'person':
      return `${p.lastname}, ${p.firstname}`
    case 'group':
      return p.label
    case 'unknown':
      return p.label
  }
}

export function fmtPersonShort(p: Identity): string {
  switch (p.kind) {
    case 'person':
      return p.abbreviation
    case 'group':
      return p.id.toUpperCase()
    case 'unknown':
      return p.id.toUpperCase()
  }
}

export function fmtManagement(m: ModuleManagement): string {
  switch (m.kind) {
    case 'person':
      return m.lastname
    case 'group':
      return m.id
    case 'unknown':
      return m.id
  }
}

export function fmtModule(m: ModuleCore): string {
  return `${m.title}; ${fmtManagement(m.moduleManagement[0])}; ${m.ects} ECTS`
}

export function creditsFormatter() {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  })
}
