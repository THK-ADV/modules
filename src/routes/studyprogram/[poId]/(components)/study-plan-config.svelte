<script lang="ts">
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import * as Select from '$lib/components/ui/select/index.js'
  import { Info, Plus, Trash2 } from '@lucide/svelte'
  import { slide } from 'svelte/transition'
  import { defaultSemester, isGenericModule, type CatalogConfig } from './catalog-config.svelte'

  let { config }: { config: CatalogConfig } = $props()

  // Only mandatory generic modules with recommended semesters can be placed manually
  const placeableGenericModules = $derived(
    config.options.modules
      .filter(
        (module) =>
          isGenericModule(module) &&
          module.mandatory &&
          module.recommendedSemesters.length > 0 &&
          !config.isModuleExcluded(module.id)
      )
      .sort((a, b) => a.title.localeCompare(b.title))
  )

  const hasSpecializations = $derived(config.options.specializations.length > 0)

  const maxSemester = $derived(
    Math.max(7, ...config.options.modules.flatMap((module) => module.recommendedSemesters))
  )

  const semesterRange = $derived(Array.from({ length: maxSemester }, (_, i) => i + 1))

  function clampCount(value: number): number {
    if (!Number.isFinite(value) || value < 1) {
      return 1
    }
    return Math.min(Math.trunc(value), 20)
  }
</script>

<div class="space-y-8">
  {#if placeableGenericModules.length > 0}
    <div class="space-y-4">
      <div class="space-y-1">
        <h5 class="font-medium">Platzierung generischer Platzhalter-Module</h5>
        <p class="text-muted-foreground text-sm">
          Generische Platzhalter-Module werden standardmäßig einmal im Studienverlaufsplan
          platziert. Hier lassen sich zusätzliche Platzierungen anlegen, wenn dasselbe Modul
          mehrfach oder in mehreren Semestern belegt werden soll.
        </p>
      </div>

      <div class="space-y-2">
        {#each placeableGenericModules as module (module.id)}
          {@const occurrences = config.occurrencesOf(module.id)}
          <div class="rounded-lg border px-4 py-3">
            <div>
              <span class="text-sm font-medium">{module.title}</span>
              <span class="text-muted-foreground ml-2 text-xs">{module.abbrev}</span>
            </div>

            {#if occurrences.length === 0}
              <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <span class="text-muted-foreground text-sm">
                  Standard: Eine Platzierung im {defaultSemester(module)}. Semester
                </span>
                <Button variant="outline" size="sm" onclick={() => config.addOccurrence(module)}>
                  <Plus />
                  Platzierung hinzufügen
                </Button>
              </div>
            {:else}
              <p class="text-muted-foreground mt-3 text-sm">
                Ersetzt die Standard-Platzierung (1× im {defaultSemester(module)}. Semester).
              </p>
              <div class="mt-2 space-y-2">
                {#each occurrences as occurrence (occurrence.id)}
                  <div
                    class="flex flex-wrap items-center gap-2"
                    transition:slide={{ duration: 150 }}
                  >
                    <Select.Root
                      type="single"
                      value={String(occurrence.semester)}
                      onValueChange={(value) =>
                        config.updateOccurrence(module.id, occurrence.id, {
                          semester: Number(value)
                        })}
                    >
                      <Select.Trigger
                        class="h-8 w-36 text-sm"
                        aria-label="Semester der Platzierung"
                      >
                        {occurrence.semester}. Semester
                      </Select.Trigger>
                      <Select.Content>
                        {#each module.recommendedSemesters as semester (semester)}
                          <Select.Item value={String(semester)} label="{semester}. Semester">
                            {semester}. Semester
                          </Select.Item>
                        {/each}
                      </Select.Content>
                    </Select.Root>
                    <div class="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min="1"
                        max="20"
                        class="h-8 w-20 text-sm"
                        value={occurrence.count}
                        aria-label="Anzahl der Platzierungen"
                        onchange={(e) =>
                          config.updateOccurrence(module.id, occurrence.id, {
                            count: clampCount(Number(e.currentTarget.value))
                          })}
                      />
                      <span class="text-muted-foreground text-sm">×</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="text-muted-foreground hover:text-destructive size-8"
                      aria-label="Platzierung entfernen"
                      onclick={() => config.removeOccurrence(module.id, occurrence.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                {/each}
                <Button
                  variant="ghost"
                  size="sm"
                  class="text-muted-foreground"
                  onclick={() => config.addOccurrence(module)}
                >
                  <Plus />
                  Weitere Platzierung
                </Button>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <div class="space-y-4">
    <div class="space-y-1">
      <h5 class="font-medium">Abschnitte im Studienverlaufsplan</h5>
      {#if hasSpecializations}
        <p class="text-muted-foreground text-sm">
          Gliederung des Studienverlaufsplans in benannte Abschnitte.
        </p>
      {:else}
        <p class="text-muted-foreground text-sm">
          Der Studienverlaufsplan kann optional in benannte Abschnitte gegliedert werden. Ein
          Abschnitt umfasst alle Module bis einschließlich des angegebenen Semesters. Ohne
          Abschnitte wird eine durchgehende Tabelle erzeugt.
        </p>
      {/if}
    </div>

    {#if hasSpecializations}
      <div class="bg-muted/40 flex gap-3 rounded-lg border px-4 py-3">
        <Info class="text-muted-foreground mt-0.5 size-4 shrink-0" />
        <div class="space-y-2">
          <p class="text-sm">
            Diese Prüfungsordnung hat Schwerpunkte. Der Studienplan wird automatisch in Basisstudium
            und Schwerpunkt-Tabellen getrennt, manuelle Abschnitte sind deshalb nicht verfügbar.
          </p>
          <div class="flex flex-wrap gap-1">
            {#each config.options.specializations as specialization (specialization.id)}
              <Badge variant="outline" class="rounded-sm font-normal">
                {specialization.label}
              </Badge>
            {/each}
          </div>
        </div>
      </div>
    {:else}
      <div class="space-y-2">
        {#each config.sections as section (section.id)}
          <div class="flex flex-wrap items-center gap-2" transition:slide={{ duration: 150 }}>
            <Input
              type="text"
              placeholder="Überschrift, z.B. Grundlagen"
              class="h-9 w-full max-w-sm"
              bind:value={section.headline}
              aria-label="Überschrift des Abschnitts"
            />
            <span class="text-muted-foreground text-sm">bis</span>
            <Select.Root
              type="single"
              value={String(section.untilSemester)}
              onValueChange={(value) => (section.untilSemester = Number(value))}
            >
              <Select.Trigger class="h-9 w-36 text-sm" aria-label="Abschnitt bis Semester">
                {section.untilSemester}. Semester
              </Select.Trigger>
              <Select.Content>
                {#each semesterRange as semester (semester)}
                  <Select.Item value={String(semester)} label="{semester}. Semester">
                    {semester}. Semester
                  </Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
            <Button
              variant="ghost"
              size="icon"
              class="text-muted-foreground hover:text-destructive size-9"
              aria-label="Abschnitt entfernen"
              onclick={() => config.removeSection(section.id)}
            >
              <Trash2 />
            </Button>
            {#if section.headline.trim().length === 0}
              <span class="text-sm text-amber-600 dark:text-amber-500">
                Ohne Überschrift wird der Abschnitt ignoriert
              </span>
            {/if}
          </div>
        {/each}
        <Button variant="outline" size="sm" onclick={() => config.addSection()}>
          <Plus />
          Abschnitt hinzufügen
        </Button>
      </div>
    {/if}
  </div>
</div>
