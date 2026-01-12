<script lang="ts">
  import ModificationIndicator from '$lib/components/modification-indicator.svelte'
  import MultiSelectCombobox from '$lib/components/multi-select-combobox.svelte'
  import * as Form from '$lib/components/ui/form/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Switch } from '$lib/components/ui/switch/index.js'
  import { fmtModule } from '$lib/formats'
  import { moduleUpdateState } from '$lib/store.svelte'
  import { getFieldHighlightClasses } from '$lib/types/module-draft-keys'
  import type { PageProps } from './$types'
  import { getModuleFormContext } from '../context'

  const { data }: PageProps = $props()

  const recommendedPrerequisitesStatus = data.fieldStatuses?.recommendedPrerequisites
  const requiredPrerequisitesStatus = data.fieldStatuses?.requiredPrerequisites
  const attendanceRequirementStatus = data.fieldStatuses?.attendanceRequirement
  const assessmentPrerequisiteStatus = data.fieldStatuses?.assessmentPrerequisite

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

  let attendanceRequirement = {
    get value() {
      return $formData.attendanceRequirement !== null
    },
    set value(newValue: boolean) {
      $formData.attendanceRequirement = newValue ? { min: '', reason: '', absence: '' } : null
    }
  }

  let attendanceRequirementMin = {
    get value() {
      return $formData.attendanceRequirement?.min ?? ''
    },
    set value(newValue: string) {
      if ($formData.attendanceRequirement) {
        $formData.attendanceRequirement.min = newValue
      }
    }
  }

  let attendanceRequirementReason = {
    get value() {
      return $formData.attendanceRequirement?.reason ?? ''
    },
    set value(newValue: string) {
      if ($formData.attendanceRequirement) {
        $formData.attendanceRequirement.reason = newValue
      }
    }
  }

  let attendanceRequirementAbsence = {
    get value() {
      return $formData.attendanceRequirement?.absence ?? ''
    },
    set value(newValue: string) {
      if ($formData.attendanceRequirement) {
        $formData.attendanceRequirement.absence = newValue
      }
    }
  }

  let assessmentPrerequisite = {
    get value() {
      return $formData.assessmentPrerequisite !== null
    },
    set value(newValue: boolean) {
      $formData.assessmentPrerequisite = newValue ? { modules: '', reason: '' } : null
    }
  }

  let assessmentPrerequisiteModules = {
    get value() {
      return $formData.assessmentPrerequisite?.modules ?? ''
    },
    set value(newValue: string) {
      if ($formData.assessmentPrerequisite) {
        $formData.assessmentPrerequisite.modules = newValue
      }
    }
  }

  let assessmentPrerequisiteReason = {
    get value() {
      return $formData.assessmentPrerequisite?.reason ?? ''
    },
    set value(newValue: string) {
      if ($formData.assessmentPrerequisite) {
        $formData.assessmentPrerequisite.reason = newValue
      }
    }
  }
</script>

<div class="space-y-10">
  <div class="space-y-4">
    <div class="space-y-2 border-b pb-4">
      <h3 class="text-lg font-medium text-foreground">Voraussetzungen</h3>
      <p class="text-sm text-muted-foreground">
        Festlegung von Voraussetzungen für die Teilnahme an einem Modul und Erfassung der
        Prüfungslast.
      </p>
    </div>
  </div>

  <!-- Recommended Prerequisites -->
  <div
    class="space-y-4 {recommendedPrerequisitesStatus
      ? getFieldHighlightClasses(recommendedPrerequisitesStatus)
      : ''}"
  >
    <div class="space-y-2 border-b pb-4">
      <div class="flex items-center justify-between">
        <h4 class="text-base font-medium text-foreground">Empfohlene Voraussetzungen (optional)</h4>
        {#if recommendedPrerequisitesStatus}
          <ModificationIndicator
            status={recommendedPrerequisitesStatus}
            iconOnly={false}
            inline={true}
          />
        {/if}
      </div>
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

  <!-- Required Prerequisites -->
  <div
    class="space-y-4 {requiredPrerequisitesStatus
      ? getFieldHighlightClasses(requiredPrerequisitesStatus)
      : ''}"
  >
    <div class="space-y-2 border-b pb-4">
      <div class="flex items-center justify-between">
        <h4 class="text-base font-medium text-foreground">Zwingende Voraussetzungen (optional)</h4>
        {#if requiredPrerequisitesStatus}
          <ModificationIndicator
            status={requiredPrerequisitesStatus}
            iconOnly={false}
            inline={true}
          />
        {/if}
      </div>
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

  <!-- Attendance Requirement -->
  <div
    class="space-y-4 {attendanceRequirementStatus
      ? getFieldHighlightClasses(attendanceRequirementStatus)
      : ''}"
  >
    <div class="space-y-2 border-b pb-4">
      <div class="flex items-center justify-between">
        <h4 class="text-base font-medium text-foreground">Anwesenheitspflicht (optional)</h4>
        {#if attendanceRequirementStatus}
          <ModificationIndicator
            status={attendanceRequirementStatus}
            iconOnly={false}
            inline={true}
          />
        {/if}
      </div>
      <p class="text-sm text-muted-foreground">
        Die Festlegung von Anwesenheitspflichten stellt eine Ausnahme dar. <a
          href="/help#attendance-requirement"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary underline hover:no-underline">Mehr Infos.</a
        >
      </p>
    </div>

    <div class="space-y-4">
      <div class="flex items-center space-x-2">
        <Switch id="attendanceRequirement" bind:checked={attendanceRequirement.value} />
        <Label for="attendanceRequirement">Anwesenheitspflicht</Label>
      </div>
      {#if attendanceRequirement.value}
        <Form.Field {form} name="attendanceRequirement.min">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>Mindestpräsenzzeit</Form.Label>
              <Input
                {...props}
                bind:value={attendanceRequirementMin.value}
                placeholder="z.B. 5 / 7 Terminen"
                class={$errors.attendanceRequirement?.min ? 'border-destructive' : ''}
              />
            {/snippet}
          </Form.Control>
          <Form.Description
            >Mindestpräsenzzeit als Zulassungsvoraussetzung zur (Teil) Modulprüfung.</Form.Description
          >
          <Form.FieldErrors />
        </Form.Field>

        <Form.Field {form} name="attendanceRequirement.reason">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>Begründung</Form.Label>
              <Input
                {...props}
                bind:value={attendanceRequirementReason.value}
                placeholder="Begründung für die Anwesenheitspflicht…"
                class={$errors.attendanceRequirement?.reason ? 'border-destructive' : ''}
              />
            {/snippet}
          </Form.Control>
          <Form.Description>Begründung für die Anwesenheitspflicht.</Form.Description>
          <Form.FieldErrors />
        </Form.Field>

        <Form.Field {form} name="attendanceRequirement.absence">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>Umgang mit Fehlzeiten</Form.Label>
              <Input
                {...props}
                bind:value={attendanceRequirementAbsence.value}
                placeholder="Umgang mit Fehlzeiten…"
                class={$errors.attendanceRequirement?.absence ? 'border-destructive' : ''}
              />
            {/snippet}
          </Form.Control>
          <Form.Description>Umgang mit Fehlzeiten.</Form.Description>
          <Form.FieldErrors />
        </Form.Field>
      {/if}
    </div>
  </div>

  <!-- Assessment Prerequisite -->
  <div
    class="space-y-4 {assessmentPrerequisiteStatus
      ? getFieldHighlightClasses(assessmentPrerequisiteStatus)
      : ''}"
  >
    <div class="space-y-2 border-b pb-4">
      <div class="flex items-center justify-between">
        <h4 class="text-base font-medium text-foreground">Prüfungsvorleistung (optional)</h4>
        {#if assessmentPrerequisiteStatus}
          <ModificationIndicator
            status={assessmentPrerequisiteStatus}
            iconOnly={false}
            inline={true}
          />
        {/if}
      </div>
      <p class="text-sm text-muted-foreground">
        Die Festlegung von Prüfungsvorleistungen stellt eine Ausnahme dar und kann nur in engen
        Grenzen zur Voraussetzung für die Zulassung zur Modulprüfung gemacht werden. <a
          href="/help#assessment-prerequisite"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary underline hover:no-underline">Mehr Infos.</a
        >
      </p>
    </div>

    <div class="space-y-4">
      <div class="flex items-center space-x-2">
        <Switch id="assessmentPrerequisite" bind:checked={assessmentPrerequisite.value} />
        <Label for="assessmentPrerequisite">Prüfungsvorleistung</Label>
      </div>
      {#if assessmentPrerequisite.value}
        <Form.Field {form} name="assessmentPrerequisite.modules">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>Betroffene Module</Form.Label>
              <Input
                {...props}
                bind:value={assessmentPrerequisiteModules.value}
                placeholder="Modulename…"
                class={$errors.assessmentPrerequisite?.modules ? 'border-destructive' : ''}
              />
            {/snippet}
          </Form.Control>
          <Form.Description
            >Prüfungsvorleistung als Zulassungsvoraussetzung zur Modulprüfung.</Form.Description
          >
          <Form.FieldErrors />
        </Form.Field>

        <Form.Field {form} name="assessmentPrerequisite.reason">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>Begründung</Form.Label>
              <Input
                {...props}
                bind:value={assessmentPrerequisiteReason.value}
                placeholder="Begründung für die Prüfungsvorleistung…"
                class={$errors.assessmentPrerequisite?.reason ? 'border-destructive' : ''}
              />
            {/snippet}
          </Form.Control>
          <Form.Description>Begründung für die Prüfungsvorleistung.</Form.Description>
          <Form.FieldErrors />
        </Form.Field>
      {/if}
    </div>
  </div>
</div>
