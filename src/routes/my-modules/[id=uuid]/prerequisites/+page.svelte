<script lang="ts">
  import MultiSelectCombobox from '$lib/components/multi-select-combobox.svelte'
  import * as Form from '$lib/components/ui/form/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { fmtModule } from '$lib/formats'
  import { moduleUpdateState } from '$lib/store.svelte'
  import { getModuleFormContext } from '../context'

  const moduleOptions = moduleUpdateState.modules.map((m) => ({
    id: m.id,
    label: fmtModule(m),
    abbrev: m.abbreviation
  }))

  const form = getModuleFormContext()
  const { form: formData, errors } = form

  let recommendedText = {
    get value() {
      return $formData.recommendedPrerequisites?.text ?? ''
    },
    set value(newValue: string) {
      if (!$formData.recommendedPrerequisites) {
        $formData.recommendedPrerequisites = { text: '', modules: [] }
      }
      $formData.recommendedPrerequisites.text = newValue

      if (
        !$formData.recommendedPrerequisites.text &&
        $formData.recommendedPrerequisites.modules.length === 0
      ) {
        $formData.recommendedPrerequisites = null
      }
    }
  }

  let recommendedModules = {
    get value() {
      return $formData.recommendedPrerequisites?.modules ?? []
    },
    set value(newValue: string[]) {
      if (!$formData.recommendedPrerequisites) {
        $formData.recommendedPrerequisites = { text: '', modules: [] }
      }
      $formData.recommendedPrerequisites.modules = newValue

      if (
        !$formData.recommendedPrerequisites.text &&
        $formData.recommendedPrerequisites.modules.length === 0
      ) {
        $formData.recommendedPrerequisites = null
      }
    }
  }

  let requiredText = {
    get value() {
      return $formData.requiredPrerequisites?.text ?? ''
    },
    set value(newValue: string) {
      if (!$formData.requiredPrerequisites) {
        $formData.requiredPrerequisites = { text: '', modules: [] }
      }
      $formData.requiredPrerequisites.text = newValue

      if (
        !$formData.requiredPrerequisites.text &&
        $formData.requiredPrerequisites.modules.length === 0
      ) {
        $formData.requiredPrerequisites = null
      }
    }
  }

  let requiredModules = {
    get value() {
      return $formData.requiredPrerequisites?.modules ?? []
    },
    set value(newValue: string[]) {
      if (!$formData.requiredPrerequisites) {
        $formData.requiredPrerequisites = { text: '', modules: [] }
      }
      $formData.requiredPrerequisites.modules = newValue

      if (
        !$formData.requiredPrerequisites.text &&
        $formData.requiredPrerequisites.modules.length === 0
      ) {
        $formData.requiredPrerequisites = null
      }
    }
  }
</script>

<div class="space-y-8">
  <div class="space-y-4">
    <div class="space-y-2 border-b pb-4">
      <h3 class="text-lg font-medium text-foreground">Empfohlene Voraussetzungen (optional)</h3>
      <p class="text-sm text-muted-foreground">
        Module oder Kenntnisse, die zur erfolgreichen Teilnahme empfohlen werden.
      </p>
    </div>

    <div class="space-y-4">
      <Form.Field {form} name="recommendedPrerequisites.text">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Freitext</Form.Label>
            <Input
              {...props}
              bind:value={recommendedText.value}
              placeholder="Beschreibung der empfohlenen Voraussetzungen…"
              class={$errors.recommendedPrerequisites?.text ? 'border-destructive' : ''}
            />
          {/snippet}
        </Form.Control>
        <Form.Description
          >Textuelle Beschreibung empfohlener Vorkenntnisse oder Fähigkeiten.</Form.Description
        >
        <Form.FieldErrors />
      </Form.Field>

      <MultiSelectCombobox
        {form}
        name="recommendedPrerequisites.modules"
        label="Module"
        description="Erfolgreich absolvierte Module, die empfohlen werden."
        options={moduleOptions}
        bind:value={recommendedModules.value}
        width="w-[500px]"
        {errors}
      />
    </div>
  </div>

  <div class="space-y-4">
    <div class="space-y-2 border-b pb-4">
      <h3 class="text-lg font-medium text-foreground">Zwingende Voraussetzungen (optional)</h3>
      <p class="text-sm text-muted-foreground">
        Module oder Kenntnisse, die zwingend erforderlich sind. Nur erlaubt, wenn diese akkreditiert
        sind.
      </p>
    </div>

    <div class="space-y-4">
      <Form.Field {form} name="requiredPrerequisites.text">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Freitext</Form.Label>
            <Input
              {...props}
              bind:value={requiredText.value}
              placeholder="Beschreibung der zwingenden Voraussetzungen…"
              class={$errors.requiredPrerequisites?.text ? 'border-destructive' : ''}
            />
          {/snippet}
        </Form.Control>
        <Form.Description
          >Textuelle Beschreibung zwingend erforderlicher Vorkenntnisse</Form.Description
        >
        <Form.FieldErrors />
      </Form.Field>

      <MultiSelectCombobox
        {form}
        name="requiredPrerequisites.modules"
        label="Module"
        description="Erfolgreich absolvierte Module, die zwingend vorausgesetzt werden."
        options={moduleOptions}
        bind:value={requiredModules.value}
        width="w-[500px]"
        {errors}
      />
    </div>
  </div>
</div>
