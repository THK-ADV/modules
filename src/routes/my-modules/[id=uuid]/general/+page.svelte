<script lang="ts">
  import ComboboxField from '$lib/components/combobox.svelte'
  import InputField from '$lib/components/input-field.svelte'
  import { moduleUpdateState } from '$lib/store.svelte.js'
  import type { PageProps } from '../$types'
  import { getModuleFormContext } from '../context'

  let { data }: PageProps = $props()

  let moduleTypes = moduleUpdateState.moduleTypes
  let languages = moduleUpdateState.languages
  let seasons = moduleUpdateState.seasons
  let locations = moduleUpdateState.locations
  let status = moduleUpdateState.status

  const form = getModuleFormContext()
  const { form: formData, errors } = form

  const titleStatus = data.fieldStatuses?.title
  const abbrevStatus = data.fieldStatuses?.abbrev
  const ectsStatus = data.fieldStatuses?.ects
  const moduleTypeStatus = data.fieldStatuses?.moduleType
  const languageStatus = data.fieldStatuses?.language
  const statusStatus = data.fieldStatuses?.status
  const durationStatus = data.fieldStatuses?.duration
  const seasonStatus = data.fieldStatuses?.season
  const locationStatus = data.fieldStatuses?.location
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
      <InputField
        {form}
        name="title"
        label="Modulbezeichnung"
        placeholder="z.B. Grundlagen der Informatik"
        description="Die Modulbezeichnung wird an vielen Stellen als Bezeichner für das Modul verwendet, wie z.B. im Inhaltsverzeichnis des Modulhandbuchs und in den Prüfungslisten."
        bind:value={$formData.title}
        {errors}
        modificationStatus={titleStatus}
        disabled={true}
      />

      <InputField
        {form}
        name="abbrev"
        label="Modulabkürzung"
        placeholder="z.B. GdI"
        description="Die Modulabkürzung wird im Modulhandbuch und an einigen Stellen anstelle der Modulbezeichnung verwendet."
        bind:value={$formData.abbrev}
        {errors}
        modificationStatus={abbrevStatus}
      />

      <InputField
        {form}
        name="ects"
        label="Credits"
        type="number"
        step="any"
        placeholder="z.B. 5.0"
        description="ECTS-Punkte, die für das erfolgreiche Absolvieren des Moduls vergeben werden."
        bind:value={$formData.ects}
        {errors}
        modificationStatus={ectsStatus}
      />
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
        description="Ein normales Modul kann von Studierenden belegt werden und taucht im Studienverlaufs- und Stundenplan auf. Ein generisches Modul ist ein Platzhalter, worauf andere Module einzahlen bzw. welches von anderen konkreten Modulen instanziert wird. <a href='/help#module-types' class='text-primary underline hover:no-underline' target='_blank' rel='noopener noreferrer'>Mehr Infos.</a>"
        options={moduleTypes}
        bind:value={$formData.moduleType}
        {errors}
        modificationStatus={moduleTypeStatus}
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
        modificationStatus={languageStatus}
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
        modificationStatus={statusStatus}
      />
    </div>
  </div>

  <div class="space-y-4">
    <div class="space-y-2 border-b pb-4">
      <h4 class="text-base font-medium text-foreground">Terminplanung</h4>
      <p class="text-sm text-muted-foreground">Zeitliche und örtliche Einordnung des Moduls.</p>
    </div>

    <div class="space-y-4">
      <InputField
        {form}
        name="duration"
        label="Moduldauer"
        type="number"
        placeholder="z.B. 1"
        description="Die Anzahl an Semestern, über die sich das Modul erstreckt."
        bind:value={$formData.duration}
        {errors}
        modificationStatus={durationStatus}
      />

      <ComboboxField
        {form}
        name="season"
        label="Häufigkeit des Angebots"
        placeholder="Häufigkeit auswählen…"
        description="Das Semester, in dem das Modul angeboten wird."
        options={seasons}
        bind:value={$formData.season}
        {errors}
        modificationStatus={seasonStatus}
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
        modificationStatus={locationStatus}
      />
    </div>
  </div>
</div>
