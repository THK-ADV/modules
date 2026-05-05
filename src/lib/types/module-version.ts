import type { ModuleCore } from '$lib/types/schedule'
import type { Semester } from '$lib/types/semester'

export interface Deleted {
  type: 'deleted'
}

export interface Parsed {
  type: 'parsed'
  module: ModuleCore
  fileContent: string
}

export interface ParseError {
  type: 'parseError'
  message: string
}

export type ModuleVersionContent = Deleted | Parsed | ParseError

export interface ModuleVersion {
  commitId: string
  committedAt: string
  content: ModuleVersionContent
  semester: Semester
}

export function isParsed(v: ModuleVersion): v is ModuleVersion & { content: Parsed } {
  return v.content.type === 'parsed'
}
