<script lang="ts">
  import ComboboxField from '$lib/components/combobox.svelte'
  import * as Form from '$lib/components/ui/form/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { moduleUpdateState } from '$lib/store.svelte.js'
  import { getModuleFormContext } from '../context'

  let moduleTypes = moduleUpdateState.moduleTypes
  let languages = moduleUpdateState.languages
  let seasons = moduleUpdateState.seasons
  let locations = moduleUpdateState.locations
  let status = moduleUpdateState.status

  const form = getModuleFormContext()
  const { form: formData, errors } = form
</script>

<div class="space-y-8">
  <div class="space-y-4">
    <div class="space-y-2 border-b pb-4">
      <h3 class="text-lg font-medium text-foreground">Allgemeine Informationen</h3>
      <p class="text-sm text-muted-foreground">
        Grundlegende Informationen und Klassifizierung des Moduls.
      </p>
    </div>
  </div>

  <div class="space-y-4">
    <div class="space-y-2 border-b pb-4">
      <h4 class="text-base font-medium text-foreground">Grundangaben</h4>
      <p class="text-sm text-muted-foreground">Name, Abkürzung und Credits des Moduls.</p>
    </div>

    <div class="space-y-4">
      <Form.Field {form} name="title">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Modulbezeichnung</Form.Label>
            <Input
              {...props}
              bind:value={$formData.title}
              placeholder="z.B. Grundlagen der Informatik"
              class={$errors.title ? 'border-destructive' : ''}
            />
          {/snippet}
        </Form.Control>
        <Form.Description
          >Die Modulbezeichnung wird an vielen Stellen als Bezeichner für das Modul verwendet, wie
          z.B. im Inhaltsverzeichnis des Modulhandbuchs und in den Prüfungslisten.</Form.Description
        >
        <Form.FieldErrors />
      </Form.Field>

      <Form.Field {form} name="abbrev">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Modulabkürzung</Form.Label>
            <Input
              {...props}
              bind:value={$formData.abbrev}
              placeholder="z.B. GdI"
              class={$errors.abbrev ? 'border-destructive' : ''}
            />
          {/snippet}
        </Form.Control>
        <Form.Description
          >Die Modulabkürzung wird im Modulhandbuch und an einigen Stellen anstelle der
          Modulbezeichnung verwendet.</Form.Description
        >
        <Form.FieldErrors />
      </Form.Field>

      <Form.Field {form} name="ects">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Credits</Form.Label>
            <Input
              type="number"
              step="any"
              {...props}
              bind:value={$formData.ects}
              placeholder="z.B. 5.0"
              class={$errors.ects ? 'border-destructive' : ''}
            />
          {/snippet}
        </Form.Control>
        <Form.Description
          >ECTS-Punkte, die für das erfolgreiche Absolvieren des Moduls vergeben werden.</Form.Description
        >
        <Form.FieldErrors />
      </Form.Field>
    </div>
  </div>

  <div class="space-y-4">
    <div class="space-y-2 border-b pb-4">
      <h4 class="text-base font-medium text-foreground">Klassifizierung</h4>
      <p class="text-sm text-muted-foreground">
        Art, Sprache und organisatorische Einordnung des Moduls.
      </p>
    </div>

    <div class="space-y-4">
      <ComboboxField
        {form}
        name="moduleType"
        label="Modulart"
        placeholder="Modulart auswählen…"
        description="Ein normales Modul kann von Studierenden belegt werden und taucht im Studienverlaufs- und Stundenplan auf. Ein generisches Modul ist ein Platzhalter, worauf andere Module einzahlen bzw. welches von anderen konkreten Modulen instanziert wird. <a href='/help/module-types' class='text-primary underline hover:no-underline'>Mehr Infos.</a>"
        options={moduleTypes}
        bind:value={$formData.moduleType}
        {errors}
      />

      <ComboboxField
        {form}
        name="language"
        label="Sprache"
        placeholder="Sprache auswählen…"
        description="Die Sprache, in der das Modul angeboten wird."
        options={languages}
        bind:value={$formData.language}
        {errors}
      />

      <ComboboxField
        {form}
        name="status"
        label="Modulstatus"
        placeholder="Status auswählen…"
        description="Status darüber, ob das Modul gemäß der Semesterangabe angeboten wird. Inaktive Module werden bei der Stundenplanung nicht berücksichtigt."
        options={status}
        bind:value={$formData.status}
        {errors}
      />
    </div>
  </div>

  <div class="space-y-4">
    <div class="space-y-2 border-b pb-4">
      <h4 class="text-base font-medium text-foreground">Terminplanung</h4>
      <p class="text-sm text-muted-foreground">Zeitliche und örtliche Einordnung des Moduls.</p>
    </div>

    <div class="space-y-4">
      <Form.Field {form} name="duration">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Moduldauer</Form.Label>
            <Input
              type="number"
              {...props}
              bind:value={$formData.duration}
              placeholder="z.B. 1"
              class={$errors.duration ? 'border-destructive' : ''}
            />
          {/snippet}
        </Form.Control>
        <Form.Description
          >Die Anzahl an Semestern, über die sich das Modul erstreckt.</Form.Description
        >
        <Form.FieldErrors />
      </Form.Field>

      <ComboboxField
        {form}
        name="season"
        label="Häufigkeit des Angebots"
        placeholder="Häufigkeit auswählen…"
        description="Das Semester, in dem das Modul angeboten wird."
        options={seasons}
        bind:value={$formData.season}
        {errors}
      />

      <ComboboxField
        {form}
        name="location"
        label="Angeboten am Standort"
        placeholder="Standort auswählen…"
        description="Der Standort, an dem das Modul angeboten wird."
        options={locations}
        bind:value={$formData.location}
        {errors}
      />
    </div>
  </div>
</div>
