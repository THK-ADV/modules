<script lang="ts" module>
  interface Props {
    showModuleCatalogCreateDialog: StudyProgram | undefined
    isPreview: boolean
  }

  function fmtStudyProgram(studyProgram: StudyProgram) {
    if (studyProgram.specialization) {
      return `${studyProgram.deLabel} ${studyProgram.specialization.deLabel} (${studyProgram.degree.deLabel})`
    }
    return `${studyProgram.deLabel} (${studyProgram.degree.deLabel})`
  }
</script>

<script lang="ts">
  import MultiSelectCombobox from '$lib/components/multi-select-combobox.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import { fetchGenericModules } from '$lib/generic-module'
  import { createModuleCatalog, previewModuleCatalog } from '$lib/preview-action'
  import type { StudyProgram } from '$lib/types/study-program'
  import { superForm } from 'sveltekit-superforms'
  import { zodClient } from 'sveltekit-superforms/adapters'
  import { z } from 'zod'

  let { showModuleCatalogCreateDialog = $bindable(), isPreview }: Props = $props()

  const genericModuleOptions = $derived.by(async () => {
    const sp = showModuleCatalogCreateDialog

    if (!sp) {
      return []
    }
    const genericModules = await fetchGenericModules(sp.id, sp.po.id, fetch)
    return genericModules.map((m) => ({
      id: m.id,
      label: m.title,
      abbrev: m.abbrev
    }))
  })

  const dialogTitle = $derived.by(() => {
    const sp = showModuleCatalogCreateDialog
    if (!sp) {
      return ''
    }
    if (isPreview) {
      return `Vorschau des Modulhandbuchs für ${fmtStudyProgram(sp)}`
    }
    return `Modulhandbuch für ${fmtStudyProgram(sp)} erstellen`
  })

  function createDialogForm() {
    const schema = z.object({
      genericModules: z.array(z.string()).default([])
    })

    return superForm(
      {
        genericModules: new Array<string>()
      },
      {
        SPA: true,
        validators: zodClient(schema)
      }
    )
  }

  const dialogForm = createDialogForm()
  const { form: dialogFormData, errors: dialogErrors, reset } = dialogForm

  function closeDialog() {
    showModuleCatalogCreateDialog = undefined
    reset() // resets the form to it's initial state
  }

  async function handleSubmit() {
    const sp = showModuleCatalogCreateDialog
    const genericModules = $dialogFormData.genericModules

    closeDialog()

    if (!sp) {
      return
    }

    if (isPreview) {
      await previewModuleCatalog(sp, genericModules)
    } else {
      await createModuleCatalog(sp, genericModules)
    }
  }
</script>

<Dialog.Root
  open={showModuleCatalogCreateDialog !== undefined}
  onOpenChange={(open) => {
    if (!open) {
      closeDialog()
    }
  }}
>
  <Dialog.Content class="max-w-lg">
    <Dialog.Header>
      <Dialog.Title class="text-lg font-semibold">{dialogTitle}</Dialog.Title>
      <Dialog.Description>Optionen festlegen</Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4 py-4">
      <!-- Generic Module Selection -->
      <MultiSelectCombobox
        form={dialogForm}
        name="genericModules"
        label="Module ausschließen"
        description="Wählen Sie die Module aus, die <span class='font-bold'>nicht</span> im Modulhandbuch berücksichtigt werden sollen. Wenn keine Auswahl getroffen wird, werden alle Module berücksichtigt."
        options={await genericModuleOptions}
        bind:value={$dialogFormData.genericModules}
        errors={$dialogErrors}
      />
    </div>

    <Dialog.Footer class="gap-2">
      <Button type="button" variant="outline" onclick={closeDialog}>Abbrechen</Button>
      <Button type="button" onclick={handleSubmit}>Erstellen</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
