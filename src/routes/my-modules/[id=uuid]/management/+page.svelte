<script lang="ts">
  import MultiSelectCombobox from '$lib/components/multi-select-combobox.svelte'
  import { moduleUpdateState } from '$lib/store.svelte.js'
  import { getModuleFormContext } from '../context'

  const form = getModuleFormContext()
  const { form: formData, errors } = form

  const identities = moduleUpdateState.identities
  const people = identities.filter((a) => a.identity.kind === 'person')

  let nonManagementPeople = $derived.by(() => {
    const currentManagement = $formData.management
    return people.filter((a) => !currentManagement.includes(a.identity.id))
  })

  const identityOptions = identities.map(({ identity, label }) => ({
    id: identity.id,
    label
  }))

  const nonManagementOptions = $derived(
    nonManagementPeople.map(({ identity, label }) => ({
      id: identity.id,
      label
    }))
  )
</script>

<div class="space-y-8">
  <div class="space-y-4">
    <div class="border-b pb-2">
      <h3 class="text-lg font-medium text-foreground">Verantwortliche</h3>
      <p class="text-sm text-muted-foreground">
        Festlegung der Modulverantwortung, Dozierenden und Bearbeitungsrechte.
      </p>
    </div>
  </div>

  <div class="space-y-4">
    <div class="border-b pb-2">
      <h4 class="text-base font-medium text-foreground">Modulverantwortung und Lehre</h4>
      <p class="text-sm text-muted-foreground">
        Hauptverantwortliche und aktive Lehrende des Moduls.
      </p>
    </div>

    <div class="space-y-4">
      <MultiSelectCombobox
        {form}
        name="management"
        label="Modulverantwortung"
        description="Modulverantwortliche tauchen häufig zusammen mit der Modulbezeichnung auf, um ein Modul eindeutig zu benennen."
        options={identityOptions}
        bind:value={$formData.management}
        {errors}
      />

      <MultiSelectCombobox
        {form}
        name="lecturers"
        label="Dozierende"
        description="Dozierende sind aktive Lehrende im Modul. Diese Information wird im Stundenplan berücksichtigt."
        options={identityOptions}
        bind:value={$formData.lecturers}
        {errors}
      />
    </div>
  </div>

  <div class="space-y-4">
    <div class="border-b pb-2">
      <h4 class="text-base font-medium text-foreground">Bearbeitungsrechte</h4>
      <p class="text-sm text-muted-foreground">
        Zusätzliche Personen mit Berechtigung zur Bearbeitung der Modulinformationen.
      </p>
    </div>

    <div class="space-y-4">
      <MultiSelectCombobox
        {form}
        name="updatePermissions"
        label="Bearbeitungsrechte"
        description="Personen, die <span class='text-primary underline'>neben den Modulverantwortlichen</span> das Modul bearbeiten können."
        options={nonManagementOptions}
        bind:value={$formData.updatePermissions}
        {errors}
      />
    </div>
  </div>
</div>
