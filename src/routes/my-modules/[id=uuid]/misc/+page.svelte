<script lang="ts">
  import ModificationIndicator from '$lib/components/modification-indicator.svelte'
  import { ModuleMultiSelect } from '$lib/components/module-filter'
  import * as Form from '$lib/components/ui/form/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { moduleUpdateState } from '$lib/stores/store.svelte'
  import { getFieldHighlightClasses } from '$lib/types/module-draft-keys'
  import { getModuleFormContext } from '../context'
  import type { PageProps } from './$types'

  const { data }: PageProps = $props()

  // svelte-ignore state_referenced_locally
  const participantsStatus = data.fieldStatuses?.participants
  // svelte-ignore state_referenced_locally
  const taughtWithStatus = data.fieldStatuses?.taughtWith
  // svelte-ignore state_referenced_locally
  const moduleRelationStatus = data.fieldStatuses?.moduleRelation

  const form = getModuleFormContext()
  const { form: formData, errors } = form

  const moduleOptions = $derived.by(() => {
    const module = data.module
    return module !== null
      ? moduleUpdateState.modules.filter(({ id }) => id !== module.id)
      : moduleUpdateState.modules
  })

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

  let moduleRelationChildren = {
    get value() {
      return $formData.moduleRelation?.children ?? []
    },
    set value(newValue: string[]) {
      $formData.moduleRelation = newValue.length > 0 ? { kind: 'parent', children: newValue } : null
    }
  }
</script>

<div class="space-y-8">
  <div class="space-y-5">
    <div class="space-y-2 border-b pb-4">
      <h3 class="text-foreground text-lg font-medium">Sonstige Informationen</h3>
      <p class="text-muted-foreground text-sm">
        Zusätzliche organisatorische Informationen wie Teilnehmerbegrenzungen, gemeinsame
        Veranstaltungen und Teilmodule.
      </p>
    </div>
  </div>

  <div class="space-y-5 {participantsStatus ? getFieldHighlightClasses(participantsStatus) : ''}">
    <div class="space-y-2 border-b pb-4">
      <div class="flex items-center justify-between">
        <h4 class="text-foreground text-base font-medium">Teilnehmerbegrenzung (optional)</h4>
        {#if participantsStatus}
          <ModificationIndicator status={participantsStatus} iconOnly={false} inline={true} />
        {/if}
      </div>
      <p class="text-muted-foreground text-sm">Wird häufig für Wahlmodule bzw. WPFs verwendet.</p>
    </div>

    <div class="space-y-5">
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

  <div class="space-y-5 {taughtWithStatus ? getFieldHighlightClasses(taughtWithStatus) : ''}">
    <div class="space-y-2 border-b pb-4">
      <div class="flex items-center justify-between">
        <h4 class="text-foreground text-base font-medium">Gemeinsame Veranstaltung (optional)</h4>
        {#if taughtWithStatus}
          <ModificationIndicator status={taughtWithStatus} iconOnly={false} inline={true} />
        {/if}
      </div>
      <p class="text-muted-foreground text-sm">
        Das Modul wird mit einem anderen Modul gemeinsam gelehrt. Wird häufig für inhaltlich
        verwandte Module verwendet.
      </p>
    </div>

    <div class="space-y-5">
      <ModuleMultiSelect
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
    class="space-y-5 {moduleRelationStatus ? getFieldHighlightClasses(moduleRelationStatus) : ''}"
  >
    <div class="space-y-2 border-b pb-4">
      <div class="flex items-center justify-between">
        <h4 class="text-foreground text-base font-medium">Teilmodule (optional)</h4>
        {#if moduleRelationStatus}
          <ModificationIndicator status={moduleRelationStatus} iconOnly={false} inline={true} />
        {/if}
      </div>
      <p class="text-muted-foreground text-sm">
        Ein Modul kann Teilmodule enthalten. Diese werden zusammen mit dem Obermodul im
        Modulhandbuch und in den Prüfungslisten angezeigt.
      </p>
    </div>

    <div class="space-y-5">
      <ModuleMultiSelect
        {form}
        name="moduleRelation.children"
        label="Teilmodule"
        description="Wählen Sie die Module aus, die diesem Obermodul untergeordnet sind."
        options={moduleOptions}
        bind:value={moduleRelationChildren.value}
        {errors}
        width="w-[500px]"
      />
    </div>
  </div>
</div>
