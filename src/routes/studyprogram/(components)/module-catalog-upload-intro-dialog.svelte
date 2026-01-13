<script lang="ts" module>
  import type { StudyProgram } from '$lib/types/study-program'

  interface Props {
    showModuleCatalogIntroductionUploadDialog: StudyProgram | undefined
    showSuccessMessage: string | undefined
    showErrorMessage: string | undefined
  }

  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  const ACCEPTED_FILE_TYPE =
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

  function fmtStudyProgram(studyProgram: StudyProgram) {
    return `${studyProgram.deLabel} (${studyProgram.degree.deLabel.charAt(0)}-PO-${studyProgram.po.version})`
  }
</script>

<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import Input from '$lib/components/ui/input/input.svelte'
  import { invalidate } from '$app/navigation'

  let {
    showModuleCatalogIntroductionUploadDialog = $bindable(),
    showSuccessMessage = $bindable(),
    showErrorMessage = $bindable()
  }: Props = $props()

  let files = $state<FileList | undefined>(undefined)
  let validationError = $state<string | undefined>(undefined)

  const hasSelectedFile = $derived(
    validationError === undefined && (files ? files.length > 0 : false)
  )

  const dialogTitle = $derived.by(() => {
    const sp = showModuleCatalogIntroductionUploadDialog
    if (!sp) {
      return ''
    }
    return `Einleitung für ${fmtStudyProgram(sp)} hochladen`
  })

  function closeDialog() {
    showModuleCatalogIntroductionUploadDialog = undefined
    files = undefined
    validationError = undefined
  }

  function validateFile(files: FileList): File | null {
    validationError = undefined

    if (files.length === 0) {
      return null
    }

    const file = files[0]

    if (file.type !== ACCEPTED_FILE_TYPE && !file.name.endsWith('.docx')) {
      validationError = 'Nur Word-Dateien (.docx) sind erlaubt'
      return null
    }

    if (file.size > MAX_FILE_SIZE) {
      validationError = `Die Datei ist zu groß. Maximale Größe: ${MAX_FILE_SIZE / 1024 / 1024}MB`
      return null
    }

    return file
  }

  async function handleSubmit() {
    showSuccessMessage = undefined
    showErrorMessage = undefined

    const sp = showModuleCatalogIntroductionUploadDialog
    const selectedFiles = files

    if (!sp || !selectedFiles) {
      return
    }

    const file = validateFile(selectedFiles)

    if (!file) {
      return
    }

    closeDialog()

    try {
      const response = await fetch(
        `/actions/module-catalog?studyProgramId=${sp.id}&poId=${sp.po.id}&action=upload`,
        {
          method: 'POST',
          headers: {
            'Content-Type': ACCEPTED_FILE_TYPE
          },
          body: file
        }
      )

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ message: 'Fehler beim Hochladen der Datei' }))
        showErrorMessage = error.message || String(error)
      } else {
        showSuccessMessage = 'Datei erfolgreich hochgeladen'
        await invalidate('preview:studyProgram')
      }
    } catch (error) {
      showErrorMessage = error instanceof Error ? error.message : String(error)
    }
  }
</script>

<Dialog.Root
  open={showModuleCatalogIntroductionUploadDialog !== undefined}
  onOpenChange={(open) => {
    if (!open) {
      closeDialog()
    }
  }}
>
  <Dialog.Content class="max-w-lg">
    <Dialog.Header>
      <Dialog.Title class="text-lg font-semibold">{dialogTitle}</Dialog.Title>
      <Dialog.Description class="space-y-2">
        <p>
          Hier wird der Einleitungstext (Prolog) des Modulhandbuchs hochgeladen. Dieser enthält
          Informationen wie das Absolvent*innenprofil, Handlungsfelder und den Studienverlaufsplan.
        </p>
        <p class="font-semibold">Anforderungen:</p>
        <ul class="list-disc space-y-1 pl-5">
          <li>Nur <span class="font-semibold">Word-Dateien (.docx)</span> werden akzeptiert</li>
          <li>Alle enthaltenen Bilder müssen im PNG-Format sein</li>
          <li>Die "Überschrift 1" darf mehrfach vorkommen</li>
        </ul>
      </Dialog.Description>
    </Dialog.Header>

    <Input
      bind:files
      oninput={(e) => {
        if (e.target && 'files' in e.target) {
          validateFile(e.target.files as FileList)
        }
      }}
      type="file"
      accept={ACCEPTED_FILE_TYPE}
    />

    {#if validationError}
      <p class="text-destructive text-sm">{validationError}</p>
    {/if}

    <Dialog.Footer class="gap-2">
      <Button type="button" variant="outline" onclick={closeDialog}>Abbrechen</Button>
      <Button type="button" disabled={!hasSelectedFile} onclick={handleSubmit}>Hochladen</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
