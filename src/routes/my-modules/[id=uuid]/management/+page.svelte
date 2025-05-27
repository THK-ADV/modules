<!-- TODO: reload on management is broken -->

<script lang="ts">
  import MultiSelectCombobox from '$lib/components/multi-select-combobox.svelte'
  import { moduleUpdateState } from '$lib/store.svelte.js'
  import { getModuleFormContext } from '../context'

  const identities = moduleUpdateState.identities
  const people = identities.filter((a) => a.identity.kind === 'person')

  let nonManagementPeople = $derived.by(() => {
    const currentManagement = $formData.management
    return people.filter((a) => !currentManagement.includes(a.identity.id))
  })

  const form = getModuleFormContext()
  const { form: formData, errors } = form

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

<!-- Management Field -->
<MultiSelectCombobox
  {form}
  name="management"
  label="Modulverantwortung"
  description="Modulverantwortliche tauchen häufig zusammen mit der Modulbezeichnung auf, um ein Modul eindeutig zu benennen."
  options={identityOptions}
  bind:value={$formData.management}
  {errors}
/>

<!-- Lecturer Field -->
<MultiSelectCombobox
  {form}
  name="lecturers"
  label="Dozierende"
  description="Dozierende sind aktive Lehrende im Modul. Diese Information wird im Stundenplan berücksichtigt."
  options={identityOptions}
  bind:value={$formData.lecturers}
  {errors}
/>

<!-- Permission Field -->
<MultiSelectCombobox
  {form}
  name="updatePermissions"
  label="Bearbeitungsrechte"
  description="Personen, die <span class='text-primary underline'>neben den Modulverantwortlichen</span> das Modul bearbeiten können."
  options={nonManagementOptions}
  bind:value={$formData.updatePermissions}
  {errors}
/>
