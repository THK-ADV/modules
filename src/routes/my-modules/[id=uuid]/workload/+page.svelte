<script lang="ts">
  import ModificationIndicator from '$lib/components/modification-indicator.svelte'
  import * as Form from '$lib/components/ui/form/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { getPOsWithIds } from '$lib/http'
  import { getFieldHighlightClasses } from '$lib/types/module-draft-keys'
  import { onMount } from 'svelte'
  import type { PageProps } from './$types'
  import { getModuleFormContext } from '../context'

  const { data }: PageProps = $props()

  // svelte-ignore state_referenced_locally
  const workloadStatus =
    data.fieldStatuses?.workload ||
    data.fieldStatuses?.['workload.lecture'] ||
    data.fieldStatuses?.['workload.seminar'] ||
    data.fieldStatuses?.['workload.exercise'] ||
    data.fieldStatuses?.['workload.practical'] ||
    data.fieldStatuses?.['workload.projectSupervision'] ||
    data.fieldStatuses?.['workload.projectWork']

  const form = getModuleFormContext()
  const { form: formData, errors } = form

  let ectsFactors: number[] = $state([])

  // fetch all ECTS factors from the POs that are linked to the module
  onMount(async () => {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const factors = new Set<number>()
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const pos = new Set<string>()
    for (const { po } of $formData.po.mandatory) {
      pos.add(po)
    }
    for (const { po } of $formData.po.optional) {
      pos.add(po)
    }
    const posWithECTSFactor = await getPOsWithIds(Array.from(pos))
    for (const { ectsFactor } of posWithECTSFactor) {
      factors.add(ectsFactor)
    }
    ectsFactors = factors.size > 0 ? Array.from(factors) : [30] // fallback to 30 if no POs are linked to the module
  })

  const total = $derived(
    $formData.workload.lecture +
      $formData.workload.seminar +
      $formData.workload.exercise +
      $formData.workload.practical +
      $formData.workload.projectSupervision +
      $formData.workload.projectWork
  )

  // calculate allowed hours and self study for each ECTS factor
  const allowedHoursCalculations = $derived.by(() => {
    const ects = $formData.ects
    return ectsFactors.map((factor) => {
      const allowedHours = ects * factor
      const selfStudy = allowedHours - total
      return { factor, allowedHours, selfStudy }
    })
  })

  // local validation - check if total exceeds ANY of the ECTS factor calculations
  const hasCustomWorkloadError = $derived.by(() => {
    return allowedHoursCalculations.some(({ selfStudy }) => selfStudy < 0)
  })

  const customWorkloadErrorMessage = $derived.by(() => {
    if (!hasCustomWorkloadError) return null

    if (allowedHoursCalculations.length <= 1) {
      return 'Der gesamte Workload darf die ECTS-Credits nicht überschreiten'
    } else {
      const minAllowedHours = Math.min(
        ...allowedHoursCalculations.map(({ allowedHours }) => allowedHours)
      )
      return `Der gesamte Workload (${total}h) überschreitet die minimal erlaubten Stunden (${minAllowedHours}h) für die zugeordneten Prüfungsordnungen`
    }
  })

  const hasWorkloadError = $derived(
    ($errors.workload?._errors && $errors.workload._errors.length > 0) || hasCustomWorkloadError
  )
  const consideredScheduleEntries = $derived.by(() => {
    const wl = $formData.workload
    let xs = new Array<string>()
    if (wl.lecture > 0) xs.push('Vorlesung')
    if (wl.practical > 0) xs.push('Praktikum')
    if (wl.exercise > 0) xs.push('Übung')
    if (wl.seminar > 0) xs.push('Seminar')
    return xs
  })
</script>

<div class="space-y-8">
  <div class="space-y-4">
    <div class="space-y-2 border-b pb-4">
      <h3 class="text-lg font-medium text-foreground">Workload</h3>
      <p class="text-sm text-muted-foreground">
        Der Workload orientiert sich an der SWS Rechnung. Alle Angaben in Stunden. Das Selbststudium
        berechnet sich automatisch aus der Differenz zwischen dem hier angegebenen Workload und den
        ECTS-Punkten.
      </p>
    </div>

    <div
      class="rounded-md border p-4 {hasWorkloadError
        ? 'border-destructive bg-destructive/5'
        : 'border-gray-200'}"
    >
      <div class="space-y-2 text-sm">
        {#if allowedHoursCalculations.length > 1}
          <div class="space-y-4">
            <div class="space-y-1">
              <div class="font-medium text-foreground">
                Stunden laut ECTS (je nach Prüfungsordnung)
              </div>
              <div class="text-xs text-muted-foreground">
                Dieses Modul ist verschiedenen Prüfungsordnungen mit unterschiedlichen ECTS-Faktoren
                zugeordnet
              </div>
            </div>
            {#each allowedHoursCalculations as calc (calc.factor)}
              <div class="space-y-1">
                <div class="space-x-0.5">
                  <span class="font-medium">ECTS-Faktor {calc.factor}:</span>
                  <span>{calc.allowedHours} Stunden ({$formData.ects} ECTS × {calc.factor})</span>
                </div>
                <div class="space-x-0.5">
                  <span class="font-medium">Selbststudium:</span>
                  <span
                    class={calc.selfStudy < 0 ? 'font-semibold text-destructive' : 'text-green-600'}
                    >{calc.selfStudy} Stunden</span
                  >
                </div>
              </div>
            {/each}
          </div>
        {:else if allowedHoursCalculations.length === 1}
          <div class="space-x-0.5">
            <span class="font-medium">Stunden laut ECTS:</span>
            <span
              >{allowedHoursCalculations[0].allowedHours} Stunden ({$formData.ects} ECTS × {allowedHoursCalculations[0]
                .factor})</span
            >
          </div>
          <div class="space-x-0.5">
            <span class="font-medium">Selbststudium:</span>
            <span
              class={allowedHoursCalculations[0].selfStudy < 0
                ? 'font-semibold text-destructive'
                : 'text-green-600'}>{allowedHoursCalculations[0].selfStudy} Stunden</span
            >
          </div>
        {:else}
          <div class="space-x-0.5 text-muted-foreground">
            <span>Lade ECTS-Faktoren...</span>
          </div>
        {/if}

        <div class="space-x-0.5">
          <span class="font-medium">Kontaktzeit:</span>
          <span>{total} Stunden</span>
        </div>
      </div>

      {#if hasWorkloadError}
        <div class="mt-3 rounded-md border border-destructive bg-destructive/10 p-3">
          <p class="text-sm text-destructive">
            {#if $errors.workload?._errors?.[0]}
              {$errors.workload._errors[0]}
            {:else if customWorkloadErrorMessage}
              {customWorkloadErrorMessage}
            {/if}
          </p>
        </div>
      {/if}
    </div>

    {#if consideredScheduleEntries.length > 0}
      <div
        class="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800"
      >
        <h4 class="mb-2 text-sm font-medium text-slate-900 dark:text-slate-100">
          Im Stundenplan berücksichtigte Einträge:
        </h4>
        <div class="flex flex-wrap gap-2">
          {#each consideredScheduleEntries as entry (entry)}
            <span
              class="inline-flex items-center rounded-full bg-slate-600 px-2.5 py-0.5 text-xs font-medium text-white dark:bg-slate-300 dark:text-slate-900"
            >
              {entry}
            </span>
          {/each}
        </div>
        <p class="mt-2 text-xs text-slate-700 dark:text-slate-300">
          Einträge mit einem Workload größer als 0 werden automatisch im Stundenplan berücksichtigt.
        </p>
      </div>
    {:else}
      <div class="rounded-md border border-gray-200 bg-gray-50 p-4">
        <p class="text-sm text-gray-600">
          Noch keine Einträge für den Stundenplan (alle Workload-Werte sind 0)
        </p>
      </div>
    {/if}
  </div>

  <div class="space-y-4 {workloadStatus ? getFieldHighlightClasses(workloadStatus) : ''}">
    <div class="space-y-2 border-b pb-4">
      <div class="flex items-center justify-between">
        <h4 class="text-base font-medium text-foreground">Stunden pro Kategorie</h4>
        {#if workloadStatus}
          <ModificationIndicator status={workloadStatus} iconOnly={false} inline={true} />
        {/if}
      </div>
      <p class="text-sm text-muted-foreground">
        Angabe der Arbeitsstunden je Veranstaltungstyp für das gesamte Semester.
      </p>
    </div>

    <div class="space-y-4 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
      <Form.Field {form} name="workload.lecture">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Vorlesung</Form.Label>
            <Input
              type="number"
              {...props}
              bind:value={$formData.workload.lecture}
              placeholder="z.B. 30"
              class={$errors.workload?.lecture ? 'border-destructive' : ''}
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      <Form.Field {form} name="workload.exercise">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Übung</Form.Label>
            <Input
              type="number"
              {...props}
              bind:value={$formData.workload.exercise}
              placeholder="z.B. 15"
              class={$errors.workload?.exercise ? 'border-destructive' : ''}
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      <Form.Field {form} name="workload.practical">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Praktikum</Form.Label>
            <Input
              type="number"
              {...props}
              bind:value={$formData.workload.practical}
              placeholder="z.B. 15"
              class={$errors.workload?.practical ? 'border-destructive' : ''}
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      <Form.Field {form} name="workload.seminar">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Seminar</Form.Label>
            <Input
              type="number"
              {...props}
              bind:value={$formData.workload.seminar}
              placeholder="z.B. 30"
              class={$errors.workload?.seminar ? 'border-destructive' : ''}
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      <Form.Field {form} name="workload.projectSupervision">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Projektbetreuung</Form.Label>
            <Input
              type="number"
              {...props}
              bind:value={$formData.workload.projectSupervision}
              placeholder="z.B. 10"
              class={$errors.workload?.projectSupervision ? 'border-destructive' : ''}
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>

      <Form.Field {form} name="workload.projectWork">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Projektarbeit</Form.Label>
            <Input
              type="number"
              {...props}
              bind:value={$formData.workload.projectWork}
              placeholder="z.B. 60"
              class={$errors.workload?.projectWork ? 'border-destructive' : ''}
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>
    </div>
  </div>
</div>
