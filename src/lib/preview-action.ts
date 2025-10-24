import type { StudyProgram } from './types/study-program'

function htmlPlaceholder(actionLabel: string, studyProgramLabel: string) {
  return `
    <html>
      <head><title>${actionLabel} wird generiert - ${studyProgramLabel}</title></head>
      <body style="font-family: system-ui; padding: 2rem; text-align: center; background: #f8fafc;">
        <div style="background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto;">
          <div style="width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top: 3px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1.5rem;"></div>
          <h1 style="color: #1f2937; margin-bottom: 1rem;">${actionLabel} wird generiert</h1>
          <p style="color: #6b7280; margin-bottom: 0.5rem;"><strong>${studyProgramLabel}</strong></p>
          <p style="color: #6b7280; margin-bottom: 1.5rem;">Geschätzte Dauer: <strong>~10 Sekunden</strong></p>
          <p style="color: #6b7280; font-size: 0.875rem;">Große Studiengänge benötigen mehr Zeit zur PDF-Generierung</p>
        </div>
        <style>
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </body>
    </html>
  `
}

function htmlError(actionLabel: string, errorMessage: string, isTimeoutError: boolean) {
  return `
        <html>
          <head><title>Fehler - ${actionLabel}</title></head>
          <body style="font-family: system-ui; padding: 2rem; text-align: center; background: #f8fafc;">
            <div style="background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; border-left: 4px solid #ef4444;">
              <h1 style="color: #1f2937; margin-bottom: 1rem;">Fehler beim Laden</h1>
              <p style="color: #6b7280; margin-bottom: 1.5rem; line-height: 1.6;">Fehlermeldung: ${errorMessage}</p>
              ${
                isTimeoutError
                  ? `
                <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 1rem; margin-bottom: 1.5rem; text-align: left;">
                  <p style="margin: 0; color: #92400e; font-size: 0.875rem; line-height: 1.5;">
                    <strong>Tipp bei Timeout-Fehlern:</strong><br/>
                    • Bei wiederholten Problemen kontaktieren Sie den Support
                  </p>
                </div>
              `
                  : ''
              }
            </div>
          </body>
        </html>
      `
}

export async function previewModuleCatalog(studyProgram: StudyProgram, genericModules: string[]) {
  const action = 'moduleCatalog'
  const actionLabel = 'Modulhandbuch'
  await performPreviewAction(action, actionLabel, studyProgram, JSON.stringify(genericModules))
}

export async function createModuleCatalog(studyProgram: StudyProgram, genericModules: string[]) {
  const action = 'moduleCatalog_creation'
  const actionLabel = 'Modulhandbuch'
  await performPreviewAction(action, actionLabel, studyProgram, JSON.stringify(genericModules))
}

export async function previewExamList(studyProgram: StudyProgram) {
  const action = 'examList'
  const actionLabel = 'Prüfungsliste'
  await performPreviewAction(action, actionLabel, studyProgram)
}

async function performPreviewAction(
  action: 'moduleCatalog' | 'moduleCatalog_creation' | 'examList',
  actionLabel: string,
  studyProgram: StudyProgram,
  body?: string
) {
  const newTab = window.open()
  const studyProgramLabel = studyProgram.deLabel

  newTab?.document.writeln(htmlPlaceholder(actionLabel, studyProgramLabel))
  newTab?.document.close()

  try {
    // Use a longer timeout for large programs
    const timeoutDuration = 180000 // 3 min
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutDuration)

    const po = studyProgram.po.id
    const sp = studyProgram.id
    const url = `/actions/preview/${action}?po=${encodeURIComponent(po)}&studyProgram=${encodeURIComponent(sp)}`
    const response = await fetch(url, {
      signal: controller.signal,
      body: JSON.stringify(body ?? []),
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }))
      throw new Error(error.message || `${action} failed`)
    }

    if (newTab && !newTab.closed) {
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      newTab.location.assign(blobUrl)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000)
    }
  } catch (error) {
    if (newTab && !newTab.closed) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unbekannter Fehler beim Generieren des Dokuments'
      const isTimeoutError =
        errorMessage.includes('Server Timeout') || errorMessage.includes('aborted')

      newTab.document.writeln(htmlError(actionLabel, errorMessage, isTimeoutError))
      newTab.document.close()
    }
  }
}
