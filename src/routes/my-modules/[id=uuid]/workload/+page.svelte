<script lang="ts">
  import * as Form from '$lib/components/ui/form/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { getModuleFormContext } from '../context'

  const form = getModuleFormContext()
  const { form: formData, errors } = form

  const total = $derived(
    $formData.workload.lecture +
      $formData.workload.seminar +
      $formData.workload.exercise +
      $formData.workload.practical +
      $formData.workload.projectSupervision +
      $formData.workload.projectWork
  )
  const allowedHours = $derived($formData.ects * 30)
  const selfStudy = $derived(allowedHours - total)
  const hasWorkloadError = $derived(
    $errors.workload?._errors && $errors.workload._errors.length > 0
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
    <div class="border-b pb-2">
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
        <div class="space-x-0.5">
          <span class="font-medium">Stunden laut ECTS:</span>
          <span>{allowedHours} Stunden ({$formData.ects} ECTS × 30)</span>
        </div>
        <div class="space-x-0.5">
          <span class="font-medium">Gesamter Workload:</span>
          <span>{total} Stunden</span>
        </div>
        <div class="space-x-0.5">
          <span class="font-medium">Selbststudium:</span>
          <span class={selfStudy < 0 ? 'font-semibold text-destructive' : 'text-green-600'}
            >{selfStudy} Stunden</span
          >
        </div>
      </div>

      {#if hasWorkloadError}
        <div class="mt-3 rounded-md border border-destructive bg-destructive/10 p-3">
          <p class="text-sm text-destructive">
            {$errors.workload?._errors?.[0]}
          </p>
        </div>
      {/if}
    </div>

    {#if consideredScheduleEntries.length > 0}
      <div class="rounded-md border border-blue-200 bg-blue-50 p-4">
        <h4 class="mb-2 text-sm font-medium text-blue-900">
          Im Stundenplan berücksichtigte Einträge:
        </h4>
        <div class="flex flex-wrap gap-2">
          {#each consideredScheduleEntries as entry (entry)}
            <span
              class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
            >
              {entry}
            </span>
          {/each}
        </div>
        <p class="mt-2 text-xs text-blue-700">
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

  <div class="space-y-4">
    <div class="border-b pb-2">
      <h4 class="text-base font-medium text-foreground">Stunden pro Kategorie</h4>
      <p class="text-sm text-muted-foreground">
        Angabe der Arbeitsstunden je Veranstaltungstyp für das gesamte Semester.
      </p>
    </div>

    <div class="space-y-6 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
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
