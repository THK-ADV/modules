<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import * as Tabs from '$lib/components/ui/tabs/index.js'
  import { createModuleCatalog, previewModuleCatalog } from '$lib/preview-action'
  import type { PageProps } from './$types'
  import { CatalogConfig } from './(components)/catalog-config.svelte'
  import ConfigSummary from './(components)/config-summary.svelte'
  import ElectiveModuleTable from './(components)/elective-module-table.svelte'
  import MandatoryModuleTable from './(components)/mandatory-module-table.svelte'
  import StudyPlanConfig from './(components)/study-plan-config.svelte'

  let { data }: PageProps = $props()

  const config = $derived(new CatalogConfig(data.options))
  const hasElectives = $derived(data.options.genericElectiveGroups.length > 0)

  let selectedTab = $state('mandatory')
  let generating = $state<'preview' | 'create' | undefined>(undefined)
  let showCreateConfirm = $state(false)

  async function handlePreview() {
    generating = 'preview'
    try {
      await previewModuleCatalog(data.studyProgram, config.buildConfig())
    } finally {
      generating = undefined
    }
  }

  async function handleCreate() {
    showCreateConfirm = false
    generating = 'create'
    try {
      await createModuleCatalog(data.studyProgram, config.buildConfig())
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

<div class="flex h-full flex-1 flex-col space-y-8">
  <div class="space-y-2">
    <h2 class="text-3xl font-bold tracking-tight">Modulhandbuch konfigurieren</h2>
    <p class="text-muted-foreground max-w-3xl text-sm">
      Das Modulhandbuch wird standardmäßig mit allen Modulen und einem automatisch erzeugten
      Studienverlaufsplan generiert. Hier können gezielt Abweichungen vom Standard festgelegt
      werden.
    </p>
  </div>

  <ConfigSummary
    {config}
    {generating}
    canCreate={data.canCreate}
    onPreview={handlePreview}
    onCreate={() => (showCreateConfirm = true)}
  />

  <Tabs.Root
    bind:value={
      () => (!hasElectives && selectedTab === 'electives' ? 'mandatory' : selectedTab),
      (value) => (selectedTab = value)
    }
  >
    <Tabs.List>
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
        Abgewählte Pflichtmodule werden aus dem Abschnitt "Module" <span class="font-bold">und</span
        > dem Studienverlaufsplan entfernt. Bei Modulen mit mehreren empfohlenen Semestern kann zudem
        das Semester festgelegt werden, in dem das Modul im Studienverlaufsplan erscheint.
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
      <p class="text-muted-foreground max-w-3xl text-sm">
        Feinjustierung des automatisch erzeugten Studienverlaufsplans im Modulhandbuch. Im
        Standardfall werden alle Pflichtmodule dem empfohlenen Semester nach platziert. Für den
        Teilzeit-Studienverlaufsplan lassen sich generische Platzhalter-Module separat platzieren
        und Pflichtmodule auf mehrere Semester aufteilen.
      </p>
      <StudyPlanConfig {config} />
    </Tabs.Content>
  </Tabs.Root>
</div>

<Dialog.Root bind:open={showCreateConfirm}>
  <Dialog.Content class="max-w-lg">
    <Dialog.Header>
      <Dialog.Title>Modulhandbuch erstellen</Dialog.Title>
      <Dialog.Description>
        {#if config.isDefault}
          Das Modulhandbuch wird mit der Standardkonfiguration für das aktuelle Semester erstellt.
        {:else}
          Das Modulhandbuch wird mit {config.deviationCount}
          {config.deviationCount === 1 ? 'Anpassung' : 'Anpassungen'} für das aktuelle Semester erstellt.
        {/if}
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer class="gap-2">
      <Button variant="outline" onclick={() => (showCreateConfirm = false)}>Abbrechen</Button>
      <Button onclick={handleCreate}>Erstellen</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
