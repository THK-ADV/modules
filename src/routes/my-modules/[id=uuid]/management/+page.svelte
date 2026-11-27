<script lang="ts">
  import MultiSelectCombobox from '$lib/components/multi-select-combobox.svelte'
  import { getModuleFormContext } from '../context'
  import { getIdentityOptions } from '../module-options.remote'
  import { loadEditorOptions } from '../editor-options'
  import type { PageProps } from './$types'

  let { data }: PageProps = $props()

  const form = getModuleFormContext()
  const { form: formData, errors } = form

  // svelte-ignore state_referenced_locally
  const managementStatus = data.fieldStatuses?.management
  // svelte-ignore state_referenced_locally
  const lecturersStatus = data.fieldStatuses?.lecturers
  // svelte-ignore state_referenced_locally
  const updatePermissionsStatus = data.fieldStatuses?.updatePermissions

  const identityOptions = await loadEditorOptions(getIdentityOptions)
  const people = identityOptions.filter(({ kind }) => kind === 'person')

  const nonManagementOptions = $derived(
    people.filter(({ id }) => !$formData.management.includes(id))
  )
</script>

<div class="space-y-8">
  <div class="space-y-5">
    <div class="space-y-2 border-b pb-4">
      <h3 class="text-foreground text-lg font-medium">Verantwortliche</h3>
      <p class="text-muted-foreground text-sm">
        Festlegung der Modulverantwortung, Dozierenden und Bearbeitungsrechte.
      </p>
    </div>
  </div>

  <div class="space-y-5">
    <div class="space-y-2 border-b pb-4">
      <h4 class="text-foreground text-base font-medium">Modulverantwortung und Lehre</h4>
      <p class="text-muted-foreground text-sm">
        Hauptverantwortliche und aktive Lehrende des Moduls.
      </p>
    </div>

    <div class="space-y-5">
      <MultiSelectCombobox
        {form}
        name="management"
        label="Modulverantwortung"
        description="Modulverantwortliche tauchen häufig zusammen mit der Modulbezeichnung auf, um ein Modul eindeutig zu benennen."
        options={identityOptions}
        bind:value={$formData.management}
        {errors}
        modificationStatus={managementStatus}
      />

      <MultiSelectCombobox
        {form}
        name="lecturers"
        label="Dozierende"
        description="Dozierende sind aktive Lehrende im Modul. Diese Information wird im Stundenplan berücksichtigt."
        options={identityOptions}
        bind:value={$formData.lecturers}
        {errors}
        modificationStatus={lecturersStatus}
      />
    </div>
  </div>

  <div class="space-y-5">
    <div class="space-y-2 border-b pb-4">
      <h4 class="text-foreground text-base font-medium">Bearbeitungsrechte</h4>
      <p class="text-muted-foreground text-sm">
        Zusätzliche Personen mit Berechtigung zur Bearbeitung der Modulinformationen.
      </p>
    </div>

    <div class="space-y-5">
      <MultiSelectCombobox
        {form}
        name="updatePermissions"
        label="Bearbeitungsrechte"
        description="Personen, die <span class='underline text-primary'>neben den Modulverantwortlichen</span> das Modul bearbeiten können."
        options={nonManagementOptions}
        bind:value={$formData.updatePermissions}
        {errors}
        modificationStatus={updatePermissionsStatus}
      />
    </div>
  </div>
</div>
