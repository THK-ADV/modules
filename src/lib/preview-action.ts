import type { StudyProgram } from './types/study-program'

function htmlPlaceholder(actionLabel: string, studyProgramLabel: string) {
  return `
    <html>
      <head>
        <title>${actionLabel} wird generiert - ${studyProgramLabel}</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #f8fafc;
          }
          .container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
          }
          .card {
            background-color: white;
            border-radius: 0.5rem;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
            padding: 2rem;
            max-width: 28rem;
            width: 100%;
            text-align: center;
          }
          .spinner {
            width: 3rem;
            height: 3rem;
            border: 4px solid #e2e8f0;
            border-top-color: #2563eb;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1.5rem;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          h1 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #0f172a;
            margin-bottom: 0.75rem;
          }
          .program {
            color: #334155;
            font-weight: 500;
            margin-bottom: 0.5rem;
          }
          .duration {
            color: #475569;
            margin-bottom: 1.5rem;
          }
          .duration span {
            font-weight: 600;
          }
          .note {
            font-size: 0.875rem;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="spinner"></div>
            <h1>${actionLabel} wird generiert</h1>
            <p class="program">${studyProgramLabel}</p>
            <p class="duration">Geschätzte Dauer: <span>~15 Sekunden</span></p>
            <p class="note">Große Studiengänge benötigen mehr Zeit zur PDF-Generierung</p>
          </div>
        </div>
      </body>
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
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #f8fafc;
          }
          .container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
          }
          .card {
            background-color: white;
            border-radius: 0.5rem;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
            border-left: 4px solid #ef4444;
            padding: 2rem;
            max-width: 28rem;
            width: 100%;
          }
          .header {
            display: flex;
            align-items: center;
            margin-bottom: 1rem;
          }
          .header svg {
            width: 2rem;
            height: 2rem;
            color: #ef4444;
            margin-right: 0.75rem;
            flex-shrink: 0;
          }
          .header h1 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #0f172a;
          }
          .error-box {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 0.375rem;
            padding: 1rem;
            margin-bottom: 1rem;
          }
          .error-box p {
            font-size: 0.875rem;
            color: #991b1b;
            line-height: 1.6;
          }
          .error-box span {
            font-weight: 600;
          }
          .tip-box {
            background-color: #fffbeb;
            border: 1px solid #fcd34d;
            border-radius: 0.375rem;
            padding: 1rem;
          }
          .tip-box p {
            font-size: 0.875rem;
            color: #78350f;
            line-height: 1.6;
          }
          .tip-box span {
            font-weight: 600;
            display: block;
            margin-bottom: 0.5rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h1>Fehler beim Laden</h1>
            </div>
            
            <div class="error-box">
              <p><span>Fehlermeldung:</span> ${errorMessage}</p>
            </div>
            
            ${
              isTimeoutError
                ? `
            <div class="tip-box">
              <p>
                <span>Tipp bei Timeout-Fehlern:</span>
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

function htmlPDF(blobUrl: string, filename: string, heading: string, subheading: string) {
  return `
    <html>
      <head>
        <title>${filename}</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            display: flex;
            flex-direction: column;
            height: 100vh;
            overflow: hidden;
          }
          .header {
            position: sticky;
            top: 0;
            z-index: 50;
            background-color: white;
            border-bottom: 1px solid #e2e8f0;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          }
          .header-container {
            max-width: 80rem;
            margin: 0 auto;
            padding: 1rem 1.5rem;
          }
          .header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .header-left h1 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #0f172a;
          }
          .header-left p {
            font-size: 0.875rem;
            color: #475569;
            margin-top: 0.25rem;
          }
          .download-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background-color: #0f172a;
            color: white;
            text-decoration: none;
            font-size: 0.875rem;
            font-weight: 500;
            border-radius: 0.375rem;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            transition: background-color 0.2s;
            border: none;
            cursor: pointer;
          }
          .download-btn:hover {
            background-color: #1e293b;
          }
          .download-btn svg {
            width: 1rem;
            height: 1rem;
          }
          iframe {
            flex: 1;
            border: none;
            width: 100%;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-container">
            <div class="header-content">
              <div class="header-left">
                <h1>${heading}</h1>
                <p>${subheading}</p>
              </div>
              <a href="${blobUrl}" download="${filename}" class="download-btn">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Herunterladen
              </a>
            </div>
          </div>
        </div>
        <iframe src="${blobUrl}"></iframe>
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
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #f8fafc;
          }
          .header {
            position: sticky;
            top: 0;
            z-index: 50;
            background-color: white;
            border-bottom: 1px solid #e2e8f0;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          }
          .header-container {
            max-width: 80rem;
            margin: 0 auto;
            padding: 1rem 1.5rem;
          }
          .header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .header-left h1 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #0f172a;
          }
          .header-left p {
            font-size: 0.875rem;
            color: #475569;
            margin-top: 0.25rem;
          }
          .header-buttons {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            font-size: 0.875rem;
            font-weight: 500;
            border-radius: 0.375rem;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            transition: all 0.2s;
            border: 1px solid;
            cursor: pointer;
            text-decoration: none;
          }
          .btn svg {
            width: 1rem;
            height: 1rem;
          }
          .btn-copy {
            background-color: white;
            border-color: #cbd5e1;
            color: #334155;
          }
          .btn-copy:hover {
            background-color: #f8fafc;
          }
          .btn-copy:focus {
            outline: none;
            box-shadow: 0 0 0 3px rgba(71, 85, 105, 0.1);
          }
          .btn-copy.success {
            background-color: #f0fdf4;
            border-color: #86efac;
            color: #15803d;
          }
          .btn-download {
            background-color: #0f172a;
            border-color: #0f172a;
            color: white;
          }
          .btn-download:hover {
            background-color: #1e293b;
          }
          .btn-download:focus {
            outline: none;
            box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.1);
          }
          .content {
            max-width: 80rem;
            margin: 0 auto;
            padding: 1.5rem;
          }
          .csv-container {
            background-color: white;
            border-radius: 0.5rem;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
            overflow: hidden;
          }
          .csv-scroll {
            overflow-x: auto;
          }
          pre {
            padding: 1rem;
            font-size: 0.875rem;
            color: #0f172a;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            white-space: pre;
            overflow: auto;
          }
          .footer {
            margin-top: 1rem;
            text-align: center;
            font-size: 0.875rem;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-container">
            <div class="header-content">
              <div class="header-left">
                <h1>Prüfungslast</h1>
                <p>${studyProgramLabel}</p>
              </div>
              <div class="header-buttons">
                <button 
                  id="copyButton"
                  onclick="copyToClipboard()"
                  class="btn btn-copy"
                >
                  <svg id="copyIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span id="copyText">Kopieren</span>
                </button>
                <a 
                  href="data:text/csv;charset=utf-8,${encodedCsv}" 
                  download="${filename}"
                  class="btn btn-download"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              
              button.classList.add('success');
              
              icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />';
              text.textContent = 'Kopiert!';
              
              // Reset after 2 seconds
              setTimeout(() => {
                button.classList.remove('success');
                
                icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />';
                text.textContent = 'Kopieren';
              }, 2000);
            } catch (err) {
              console.error('Failed to copy:', err);
              alert('Kopieren fehlgeschlagen. Bitte versuchen Sie es erneut.');
            }
          }
        </script>
        
        <div class="content">
          <div class="csv-container">
            <div class="csv-scroll">
              <pre>${csv}</pre>
            </div>
          </div>
          
          <div class="footer">
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
  await performFileAction(action, actionLabel, studyProgram, JSON.stringify(genericModules))
}

export async function createModuleCatalog(studyProgram: StudyProgram, genericModules: string[]) {
  const action = 'moduleCatalog_creation'
  const actionLabel = 'Modulhandbuch'
  await performFileAction(action, actionLabel, studyProgram, JSON.stringify(genericModules))
}

export async function previewExamList(studyProgram: StudyProgram) {
  const action = 'examList'
  const actionLabel = 'Prüfungsliste'
  await performFileAction(action, actionLabel, studyProgram)
}

export async function previewExamLoad(studyProgram: StudyProgram) {
  const action = 'examLoad'
  const actionLabel = 'Prüfungslast'
  await performFileAction(action, actionLabel, studyProgram)
}

async function performFileAction(
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
          newTab.document.close()
          break
        }
        case 'application/pdf': {
          const blob = await response.blob()
          const blobUrl = URL.createObjectURL(blob)

          const contentDisposition = response.headers.get('Content-Disposition')
          const filename =
            contentDisposition?.match(/filename="(.+?)"/)?.[1] ||
            `${actionLabel}_${studyProgram.po.id}.pdf`

          newTab.document.writeln(htmlPDF(blobUrl, filename, actionLabel, studyProgramLabel))
          newTab.document.close()

          // Clean up blob URL after a longer delay to ensure PDF loads
          setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
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
