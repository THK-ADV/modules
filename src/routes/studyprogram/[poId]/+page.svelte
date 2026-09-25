<script lang="ts">
  import ErrorMessage from '$lib/components/error-message.svelte'
  import SuccessMessage from '$lib/components/success-message.svelte'
  import { Button } from '$lib/components/ui/button/index.js'
  import LoadingOverlay from '$lib/components/ui/loading-overlay/loading-overlay.svelte'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import * as Tabs from '$lib/components/ui/tabs/index.js'
  import { previewModuleCatalog } from '$lib/preview-action'
  import { getStudyProgram, publishModuleCatalog } from '../studyprogram.remote'
  import { getErrorMessage } from '$lib/errors'
  import type { StudyProgram } from '$lib/types/study-program'
  import type { PageProps } from './$types'
  import ModuleCatalogUploadIntroDialog from '../(components)/module-catalog-upload-intro-dialog.svelte'
  import { CatalogConfig } from './(components)/catalog-config.svelte'
  import ConfigSummary from './(components)/config-summary.svelte'
  import ElectiveModuleTable from './(components)/elective-module-table.svelte'
  import MandatoryModuleTable from './(components)/mandatory-module-table.svelte'
  import StudyPlanConfig from './(components)/study-plan-config.svelte'

  let { data: pageData }: PageProps = $props()
  const data = $derived(await getStudyProgram(pageData.poId))

  const config = $derived(new CatalogConfig(data.options))
  const hasElectives = $derived(data.options.genericElectiveGroups.length > 0)

  let selectedTab = $state('mandatory')
  let generating = $state<'preview' | 'publish' | undefined>(undefined)
  let showPublishConfirm = $state(false)
  let introUploadTarget = $state<StudyProgram | undefined>(undefined)
  let showErrorMessage = $state<string | undefined>(undefined)
  let showSuccessMessage = $state<string | undefined>(undefined)

  async function handlePreview() {
    if (generating) return
    generating = 'preview'
    try {
      await previewModuleCatalog(data.studyProgram, config.buildConfig())
    } finally {
      generating = undefined
    }
  }

  async function handlePublish() {
    if (generating) return
    showPublishConfirm = false
    generating = 'publish'
    showErrorMessage = undefined
    showSuccessMessage = undefined
    try {
      await publishModuleCatalog({ po: data.studyProgram.po.id, config: config.buildConfig() })
      showSuccessMessage = 'Modulhandbuch freigegeben.'
    } catch (error) {
      showErrorMessage = getErrorMessage(error, 'Freigabe des Modulhandbuchs fehlgeschlagen')
    } finally {
      generating = undefined
    }
  }
</script>

{#snippet deviationDot(count: number)}
  {#if count > 0}
    <span
      class="size-1.5 shrink-0 rounded-full bg-blue-500"
      title="{count} {count === 1 ? 'Anpassung' : 'Anpassungen'}"
    ></span>
  {/if}
{/snippet}

<LoadingOverlay show={generating === 'publish'} message="Modulhandbuch wird freigegeben…" />

<ErrorMessage bind:message={showErrorMessage} />

<SuccessMessage bind:message={showSuccessMessage} />

<ModuleCatalogUploadIntroDialog
  bind:showModuleCatalogIntroductionUploadDialog={introUploadTarget}
  bind:showSuccessMessage
  bind:showErrorMessage
/>

<div class="flex h-full min-w-0 flex-1 flex-col space-y-8">
  <div class="space-y-2">
    <h2 class="text-3xl font-bold tracking-tight">Modulhandbuch konfigurieren</h2>
    <p class="text-muted-foreground max-w-3xl text-sm">
      Das Modulhandbuch wird standardmäßig mit allen Modulen und einem automatisch erzeugten
      Studienverlaufsplan generiert. Hier können gezielt Abweichungen vom Standard festgelegt und
      der Studienverlaufsplan im gleichnamigen Tab ausgeschaltet werden.
    </p>
  </div>

  <ConfigSummary
    {config}
    {generating}
    canCreate={data.canCreate}
    onPreview={handlePreview}
    onPublish={() => (showPublishConfirm = true)}
    onUploadIntroduction={() => (introUploadTarget = data.studyProgram)}
  />

  <Tabs.Root
    bind:value={
      () => (!hasElectives && selectedTab === 'electives' ? 'mandatory' : selectedTab),
      (value) => (selectedTab = value)
    }
  >
    <Tabs.List class="h-auto max-w-full flex-wrap justify-start">
      <Tabs.Trigger value="mandatory">
        <span class="flex items-center gap-1.5">
          Pflichtmodule
          {@render deviationDot(config.mandatoryTabDeviationCount)}
        </span>
      </Tabs.Trigger>
      {#if hasElectives}
        <Tabs.Trigger value="electives">
          <span class="flex items-center gap-1.5">
            Wahlmodule
            {@render deviationDot(config.electivesTabDeviationCount)}
          </span>
        </Tabs.Trigger>
      {/if}
      <Tabs.Trigger value="study-plan">
        <span class="flex items-center gap-1.5">
          Studienverlaufsplan
          {@render deviationDot(config.studyPlanTabDeviationCount)}
        </span>
      </Tabs.Trigger>
    </Tabs.List>

    <Tabs.Content value="mandatory" class="space-y-4 pt-2">
      <p class="text-muted-foreground max-w-3xl text-sm">
        Abgewählte Pflichtmodule werden aus dem Abschnitt "Module" entfernt.
        {#if config.studyPlanEnabled}
          Sie werden auch aus dem Studienverlaufsplan entfernt. Bei Modulen mit mehreren empfohlenen
          Semestern kann zudem das Semester festgelegt werden, in dem das Modul im
          Studienverlaufsplan erscheint.
        {/if}
      </p>
      <MandatoryModuleTable {config} />
    </Tabs.Content>

    {#if hasElectives}
      <Tabs.Content value="electives" class="space-y-4 pt-2">
        <p class="text-muted-foreground max-w-3xl text-sm">
          Legt fest, welche konkreten Module als Wahloption für die generischen Platzhalter-Module
          in einem eigenen Abschnitt namens "Wahlmodule" aufgeführt werden sollen. Wenn alle
          Wahloptionen abgewählt werden, wird kein Wahlmodul-Katalog als Teil des Modulhandbuchs
          erstellt.
        </p>
        <ElectiveModuleTable {config} />
      </Tabs.Content>
    {/if}

    <Tabs.Content value="study-plan" class="space-y-4 pt-2">
      {#if config.studyPlanEnabled}
        <p class="text-muted-foreground max-w-3xl text-sm">
          Feinjustierung des automatisch erzeugten Studienverlaufsplans im Modulhandbuch. Im
          Standardfall werden alle Pflichtmodule dem empfohlenen Semester nach platziert. Für den
          Teilzeit-Studienverlaufsplan lassen sich generische Platzhalter-Module separat platzieren
          und Pflichtmodule auf mehrere Semester aufteilen.
        </p>
      {/if}
      <StudyPlanConfig {config} />
    </Tabs.Content>
  </Tabs.Root>
</div>

<Dialog.Root bind:open={showPublishConfirm}>
  <Dialog.Content class="max-w-lg">
    <Dialog.Header>
      <Dialog.Title>Modulhandbuch freigeben</Dialog.Title>
      <Dialog.Description>
        {#if config.isDefault}
          Das Modulhandbuch wird mit der Standardkonfiguration öffentlich freigegeben.
        {:else}
          Das Modulhandbuch wird mit {config.deviationCount}
          {config.deviationCount === 1 ? 'Anpassung' : 'Anpassungen'} öffentlich freigegeben.
        {/if}
        {config.studyPlanEnabled
          ? 'Ein Studienverlaufsplan wird erzeugt.'
          : 'Es wird kein Studienverlaufsplan erzeugt.'}
        Semester und Freigabedatum setzt das System. Eine bereits veröffentlichte Fassung wird ersetzt.
      </Dialog.Description>
    </Dialog.Header>
    <p class="text-muted-foreground text-sm">
      Prüfen Sie die Fassung vorher mit „Vorschau“ auf Inhalt und Fehler. Die veröffentlichte PDF
      entspricht dieser Vorschau, enthält aber kein Wasserzeichen und keine Vorschauhinweise.
    </p>
    <Dialog.Footer class="gap-2">
      <Button variant="outline" onclick={() => (showPublishConfirm = false)}>Abbrechen</Button>
      <Button onclick={handlePublish}>Freigeben</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
