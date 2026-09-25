<script lang="ts">
  import type { StudyProgram } from '$lib/types/study-program'
  import Button from '$lib/components/ui/button/button.svelte'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import Input from '$lib/components/ui/input/input.svelte'
  import { LoaderCircle } from '@lucide/svelte'
  import { getErrorMessage } from '$lib/errors'
  import { fmtStudyProgram } from '$lib/formats'
  import {
    INTRODUCTION_FILE_TYPE,
    moduleCatalogUploadSchema
  } from '$lib/schemas/study-program-artifacts'
  import { uploadModuleCatalogIntroduction } from '../studyprogram.remote'

  let {
    showModuleCatalogIntroductionUploadDialog = $bindable(),
    // eslint-disable-next-line no-useless-assignment -- required for Svelte bindable prop
    showSuccessMessage = $bindable(),
    // eslint-disable-next-line no-useless-assignment -- required for Svelte bindable prop
    showErrorMessage = $bindable()
  }: {
    showModuleCatalogIntroductionUploadDialog: StudyProgram | undefined
    showSuccessMessage: string | undefined
    showErrorMessage: string | undefined
  } = $props()

  const upload = uploadModuleCatalogIntroduction.preflight(moduleCatalogUploadSchema)
  let uploading = $state(false)
  let uploadError = $state<string>()
  const dialogTitle = $derived(
    showModuleCatalogIntroductionUploadDialog
      ? `Einleitung für ${fmtStudyProgram(showModuleCatalogIntroductionUploadDialog)} hochladen`
      : ''
  )

  function closeDialog() {
    if (uploading) return
    showModuleCatalogIntroductionUploadDialog = undefined
    uploadError = undefined
    upload.element?.reset()
  }
</script>

<Dialog.Root
  open={showModuleCatalogIntroductionUploadDialog !== undefined}
  onOpenChange={(open) => {
    if (!open) closeDialog()
  }}
>
  <Dialog.Content
    class="max-w-lg"
    showClose={!uploading}
    onInteractOutside={(event) => {
      if (uploading) event.preventDefault()
    }}
    onEscapeKeydown={(event) => {
      if (uploading) event.preventDefault()
    }}
  >
    <form
      enctype="multipart/form-data"
      class="grid gap-4"
      aria-busy={uploading}
      {...upload.enhance(async (form) => {
        if (uploading) return
        uploading = true
        uploadError = undefined
        showErrorMessage = undefined
        showSuccessMessage = undefined
        try {
          if (await form.submit()) {
            showSuccessMessage = 'Einleitung erfolgreich hochgeladen.'
            uploading = false
            closeDialog()
          }
        } catch (error) {
          uploadError = getErrorMessage(error, 'Einleitung konnte nicht hochgeladen werden')
        } finally {
          uploading = false
        }
      })}
    >
      <Dialog.Header>
        <Dialog.Title class="text-lg font-semibold">{dialogTitle}</Dialog.Title>
        <Dialog.Description class="space-y-2">
          <p>
            Hier wird der Einleitungstext (Prolog) des Modulhandbuchs hochgeladen. Dieser enthält
            Informationen wie das Absolvent*innenprofil, Handlungsfelder und den
            Studienverlaufsplan.
          </p>
          <p class="font-semibold">Anforderungen:</p>
          <ul class="list-disc space-y-1 pl-5">
            <li>Nur <span class="font-semibold">Word-Dateien (.docx)</span> werden akzeptiert</li>
            <li>Die maximale Dateigröße beträgt <span class="font-semibold">10 MB</span></li>
            <li>Alle enthaltenen Bilder müssen im PNG-Format sein</li>
            <li>Die "Überschrift 1" darf mehrfach vorkommen</li>
          </ul>
        </Dialog.Description>
      </Dialog.Header>

      <input
        {...upload.fields.po.as('hidden', showModuleCatalogIntroductionUploadDialog?.po.id ?? '')}
      />
      <Input
        type="file"
        name="file"
        accept={INTRODUCTION_FILE_TYPE}
        aria-label="Einleitung als Word-Datei"
        disabled={uploading}
      />
      {#each upload.fields.allIssues() ?? [] as issue, index (index)}
        <p class="text-destructive text-sm" role="alert">{issue.message}</p>
      {/each}
      {#if uploadError}
        <p class="text-destructive text-sm" role="alert">{uploadError}</p>
      {/if}
      <Dialog.Footer class="gap-2">
        <Button type="button" variant="outline" disabled={uploading} onclick={closeDialog}
          >Abbrechen</Button
        >
        <Button type="submit" disabled={uploading}>
          {#if uploading}<LoaderCircle class="animate-spin" />{/if}
          {uploading ? 'Einleitung wird hochgeladen…' : 'Hochladen'}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
