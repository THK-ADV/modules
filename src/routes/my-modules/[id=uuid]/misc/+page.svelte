<script lang="ts">
  import Combobox from '$lib/components/combobox.svelte'
  import ModificationIndicator from '$lib/components/modification-indicator.svelte'
  import MultiSelectCombobox from '$lib/components/multi-select-combobox.svelte'
  import * as Form from '$lib/components/ui/form/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { fmtModule } from '$lib/formats'
  import { moduleUpdateState } from '$lib/store.svelte'
  import { getFieldHighlightClasses } from '$lib/types/module-draft-keys'
  import type { PageProps } from './$types'
  import { getModuleFormContext } from '../context'

  const { data }: PageProps = $props()

  // svelte-ignore state_referenced_locally
  const participantsStatus = data.fieldStatuses?.participants
  // svelte-ignore state_referenced_locally
  const taughtWithStatus = data.fieldStatuses?.taughtWith
  // svelte-ignore state_referenced_locally
  const moduleRelationStatus = data.fieldStatuses?.moduleRelation

  const form = getModuleFormContext()
  const { form: formData, errors } = form

  const withOutSelf = moduleUpdateState.modules.filter(({ id }) => id !== data.module.id)

  const moduleOptions = withOutSelf.map((m) => ({
    id: m.id,
    label: fmtModule(m),
    abbrev: m.abbreviation
  }))

  const parentOptions = withOutSelf.map((m) => ({
    id: m.id,
    deLabel: fmtModule(m)
  }))

  const moduleRelationTypeOptions = [
    { id: 'none', deLabel: 'Keine Beziehung' },
    { id: 'parent', deLabel: 'Ober-Modul' },
    { id: 'child', deLabel: 'Kind-Modul' }
  ]

  let participantsMin = {
    get value() {
      const value = $formData.participants?.min
      return value ? value.toString() : ''
    },
    set value(newValue: string) {
      if (!$formData.participants) {
        $formData.participants = { min: 0, max: 0 }
      }
      $formData.participants.min = +newValue

      if (!$formData.participants.min && !$formData.participants.max) {
        $formData.participants = null
      }
    }
  }

  let participantsMax = {
    get value() {
      const value = $formData.participants?.max
      return value ? value.toString() : ''
    },
    set value(newValue: string) {
      if (!$formData.participants) {
        $formData.participants = { min: 0, max: 0 }
      }
      $formData.participants.max = +newValue

      if (!$formData.participants.min && !$formData.participants.max) {
        $formData.participants = null
      }
    }
  }

  let taughtWith = {
    get value() {
      return $formData.taughtWith ?? []
    },
    set value(newValue: string[]) {
      $formData.taughtWith = newValue
    }
  }

  let moduleRelation = {
    get value() {
      return $formData.moduleRelation?.kind || 'none'
    },
    set value(newValue: string) {
      switch (newValue) {
        case 'parent':
          $formData.moduleRelation = { kind: 'parent', children: [] }
          break
        case 'child':
          $formData.moduleRelation = { kind: 'child', parent: '' }
          break
        case 'none':
        default:
          $formData.moduleRelation = null
          break
      }
    }
  }

  let moduleRelationParent = {
    get value() {
      const relation = $formData.moduleRelation
      if (!relation) {
        return ''
      }
      if (relation.kind === 'child') {
        return relation.parent
      } else {
        throw new Error(
          'module relation must be a child since this function is only called for child relations'
        )
      }
    },
    set value(newValue: string) {
      if (!$formData.moduleRelation) {
        $formData.moduleRelation = { kind: 'child', parent: newValue }
      } else {
        if ($formData.moduleRelation.kind === 'child') {
          $formData.moduleRelation.parent = newValue
        } else {
          throw new Error(
            'module relation must be a child since this function is only called for child relations'
          )
        }
      }
    }
  }

  let moduleRelationChildren = {
    get value() {
      const relation = $formData.moduleRelation
      if (!relation) {
        return []
      }
      if (relation.kind === 'parent') {
        return relation.children
      } else {
        throw new Error(
          'module relation must be a parent since this function is only called for parent relations'
        )
      }
    },
    set value(newValue: string[]) {
      if (!$formData.moduleRelation) {
        $formData.moduleRelation = { kind: 'parent', children: newValue }
      } else {
        if ($formData.moduleRelation.kind === 'parent') {
          $formData.moduleRelation.children = newValue
        } else {
          throw new Error(
            'module relation must be a parent since this function is only called for parent relations'
          )
        }
      }
    }
  }
</script>

<div class="space-y-8">
  <div class="space-y-4">
    <div class="space-y-2 border-b pb-4">
      <h3 class="text-lg font-medium text-foreground">Sonstige Informationen</h3>
      <p class="text-sm text-muted-foreground">
        Zusätzliche organisatorische Informationen wie Teilnehmerbegrenzungen, gemeinsame
        Veranstaltungen und Modulbeziehungen.
      </p>
    </div>
  </div>

  <div class="space-y-4 {participantsStatus ? getFieldHighlightClasses(participantsStatus) : ''}">
    <div class="space-y-2 border-b pb-4">
      <div class="flex items-center justify-between">
        <h4 class="text-base font-medium text-foreground">Teilnehmerbegrenzung (optional)</h4>
        {#if participantsStatus}
          <ModificationIndicator status={participantsStatus} iconOnly={false} inline={true} />
        {/if}
      </div>
      <p class="text-sm text-muted-foreground">Wird häufig für Wahlmodule bzw. WPFs verwendet.</p>
    </div>

    <div class="space-y-4">
      <div class="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
        <Form.Field {form} name="participants.min">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>Mindestteilnehmerzahl</Form.Label>
              <Input
                type="number"
                {...props}
                bind:value={participantsMin.value}
                placeholder="z.B. 10"
                class={$errors.participants?.min ? 'border-destructive' : ''}
              />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>

        <Form.Field {form} name="participants.max">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>Maximale Teilnehmerzahl</Form.Label>
              <Input
                type="number"
                {...props}
                bind:value={participantsMax.value}
                placeholder="z.B. 20"
                class={$errors.participants?.max ? 'border-destructive' : ''}
              />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>
      </div>
    </div>
  </div>

  <div class="space-y-4 {taughtWithStatus ? getFieldHighlightClasses(taughtWithStatus) : ''}">
    <div class="space-y-2 border-b pb-4">
      <div class="flex items-center justify-between">
        <h4 class="text-base font-medium text-foreground">Gemeinsame Veranstaltung (optional)</h4>
        {#if taughtWithStatus}
          <ModificationIndicator status={taughtWithStatus} iconOnly={false} inline={true} />
        {/if}
      </div>
      <p class="text-sm text-muted-foreground">
        Das Modul wird mit einem anderen Modul gemeinsam gelehrt. Wird häufig für inhaltlich
        verwandte Module verwendet.
      </p>
    </div>

    <div class="space-y-4">
      <MultiSelectCombobox
        {form}
        name="taughtWith"
        label="Wird gelehrt mit"
        description="Gemeinsam gelehrte Module werden im Stundenplan zusammengefasst und für die unterschiedlichen Studiengänge mit dem jeweiligem Modulnamen angezeigt."
        options={moduleOptions}
        bind:value={taughtWith.value}
        {errors}
        width="w-[500px]"
      />
    </div>
  </div>

  <div
    class="space-y-4 {moduleRelationStatus ? getFieldHighlightClasses(moduleRelationStatus) : ''}"
  >
    <div class="space-y-2 border-b pb-4">
      <div class="flex items-center justify-between">
        <h4 class="text-base font-medium text-foreground">Modulbeziehung (optional)</h4>
        {#if moduleRelationStatus}
          <ModificationIndicator status={moduleRelationStatus} iconOnly={false} inline={true} />
        {/if}
      </div>
      <p class="text-sm text-muted-foreground">
        Ein Modul kann ein Ober- oder Kind-Modul sein. Wird häufig verwendet, um mehrere Module zu
        einem Ober-Modul zusammenzufassen. Das Ober-Modul taucht dabei nicht im Stundenplan auf.
        Ober- und Kind-Module werden zusammen im Modulhandbuch und in den Prüfungslisten angezeigt.
      </p>
    </div>

    <div class="space-y-4">
      <Combobox
        {form}
        name="moduleRelation"
        label="Art der Beziehung"
        placeholder="Wählen Sie eine Option"
        description="Legt die <span class='text-primary underline'>Rolle des aktuellen Moduls</span> fest. Ein Ober-Modul enthält Kind-Module, ein Kind-Modul gehört zu einem Ober-Modul."
        options={moduleRelationTypeOptions}
        bind:value={moduleRelation.value}
        {errors}
        width="w-[500px]"
      />

      {#if $formData.moduleRelation?.kind === 'child'}
        <Combobox
          {form}
          name="moduleRelation.parent"
          label="Ober-Modul"
          placeholder="Ober-Modul auswählen"
          description="Das übergeordnete Modul, zu dem dieses Modul gehört."
          options={parentOptions}
          bind:value={moduleRelationParent.value}
          {errors}
          width="w-[500px]"
        />
      {/if}

      {#if $formData.moduleRelation?.kind === 'parent'}
        <MultiSelectCombobox
          {form}
          name="moduleRelation.children"
          label="Kind-Module"
          description="Die untergeordneten Module, die zu diesem Modul gehören. Mindestens ein Modul muss ausgewählt werden."
          options={moduleOptions}
          bind:value={moduleRelationChildren.value}
          {errors}
          width="w-[500px]"
        />
      {/if}
    </div>
  </div>
</div>
