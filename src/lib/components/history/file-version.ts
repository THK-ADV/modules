export interface FileVersion {
  id: string
  content: string
}

export interface FileVersionComparison {
  oldFileVersion: FileVersion
  newFileVersion: FileVersion
}
