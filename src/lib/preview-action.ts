import type { StudyProgram } from './types/study-program'

function htmlPlaceholder(actionLabel: string, studyProgramLabel: string) {
  return `
    <html>
      <head>
        <title>${actionLabel} wird generiert - ${studyProgramLabel}</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-slate-50">
        <div class="min-h-screen flex items-center justify-center p-4">
          <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-8 max-w-md w-full text-center">
            <div class="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
            <h1 class="text-2xl font-semibold text-slate-900 mb-3">${actionLabel} wird generiert</h1>
            <p class="text-slate-700 font-medium mb-2">${studyProgramLabel}</p>
            <p class="text-slate-600 mb-6">Geschätzte Dauer: <span class="font-semibold">~10 Sekunden</span></p>
            <p class="text-sm text-slate-500">Große Studiengänge benötigen mehr Zeit zur PDF-Generierung</p>
          </div>
        </div>
    </html>
  `
}

function htmlError(actionLabel: string, errorMessage: string, isTimeoutError: boolean) {
  return `
    <html>
      <head>
        <title>Fehler - ${actionLabel}</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-slate-50">
        <div class="min-h-screen flex items-center justify-center p-4">
          <div class="bg-white rounded-lg shadow-sm border-l-4 border-l-red-500 border border-slate-200 p-8 max-w-md w-full">
            <div class="flex items-center mb-4">
              <svg class="w-8 h-8 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h1 class="text-2xl font-semibold text-slate-900">Fehler beim Laden</h1>
            </div>
            
            <div class="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <p class="text-sm text-red-800 leading-relaxed"><span class="font-semibold">Fehlermeldung:</span> ${errorMessage}</p>
            </div>
            
            ${
              isTimeoutError
                ? `
              <div class="bg-amber-50 border border-amber-300 rounded-md p-4">
                <p class="text-sm text-amber-900 leading-relaxed">
                  <span class="font-semibold block mb-2">Tipp bei Timeout-Fehlern:</span>
                  • Bei wiederholten Problemen kontaktieren Sie den Support
                </p>
              </div>
            `
                : ''
            }
          </div>
        </div>
      </body>
    </html>
      `
}

function htmlCSV(csv: string, studyProgramLabel: string, po: string) {
  const encodedCsv = encodeURIComponent(csv)
  const filename = `pruefungslast_${po}.csv`

  return `
    <html>
      <head>
        <title>Prüfungslast für ${studyProgramLabel}</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-slate-50">
        <!-- Sticky Header with Action Buttons -->
        <div class="sticky top-0 z-50 bg-white border-b shadow-sm">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-2xl font-semibold text-slate-900">Prüfungslast</h1>
                <p class="text-sm text-slate-600 mt-1">${studyProgramLabel}</p>
              </div>
              <div class="flex items-center gap-2">
                <button 
                  id="copyButton"
                  onclick="copyToClipboard()"
                  class="inline-flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-md shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
                >
                  <svg id="copyIcon" class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span id="copyText">Kopieren</span>
                </button>
                <a 
                  href="data:text/csv;charset=utf-8,${encodedCsv}" 
                  download="${filename}"
                  class="inline-flex items-center px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
                >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Herunterladen
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <script>
          const csvData = \`${csv.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
          
          async function copyToClipboard() {
            try {
              await navigator.clipboard.writeText(csvData);
              
              // Update button to show success
              const button = document.getElementById('copyButton');
              const icon = document.getElementById('copyIcon');
              const text = document.getElementById('copyText');
              
              button.classList.remove('bg-white', 'border-slate-300', 'text-slate-700', 'hover:bg-slate-50');
              button.classList.add('bg-green-50', 'border-green-300', 'text-green-700');
              
              icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />';
              text.textContent = 'Kopiert!';
              
              // Reset after 2 seconds
              setTimeout(() => {
                button.classList.remove('bg-green-50', 'border-green-300', 'text-green-700');
                button.classList.add('bg-white', 'border-slate-300', 'text-slate-700', 'hover:bg-slate-50');
                
                icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />';
                text.textContent = 'Kopieren';
              }, 2000);
            } catch (err) {
              console.error('Failed to copy:', err);
              alert('Kopieren fehlgeschlagen. Bitte versuchen Sie es erneut.');
            }
          }
        </script>
        
        <!-- CSV Content -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div class="overflow-x-auto">
              <pre class="p-4 text-sm text-slate-900 font-mono whitespace-pre overflow-auto">${csv}</pre>
            </div>
          </div>
          
          <!-- Footer Info -->
          <div class="mt-4 text-center text-sm text-slate-500">
            <p>Die Datei kann über den obigen Button heruntergeladen werden.</p>
          </div>
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

export async function previewExamLoad(studyProgram: StudyProgram) {
  const action = 'examLoad'
  const actionLabel = 'Prüfungslast'
  await performPreviewAction(action, actionLabel, studyProgram)
}

async function performPreviewAction(
  action: 'moduleCatalog' | 'moduleCatalog_creation' | 'examList' | 'examLoad',
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
      const contentType = response.headers.get('Content-Type') || ''
      const mimeType = contentType.split(';')[0].trim()

      switch (mimeType) {
        case 'text/plain': {
          const csv = await response.text()
          newTab.document.writeln(htmlCSV(csv, studyProgramLabel, po))
          break
        }
        case 'application/pdf': {
          const blob = await response.blob()
          const blobUrl = URL.createObjectURL(blob)
          newTab.location.assign(blobUrl)
          setTimeout(() => URL.revokeObjectURL(blobUrl), 5000)
          break
        }
        default: {
          newTab.close()
          break
        }
      }
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
