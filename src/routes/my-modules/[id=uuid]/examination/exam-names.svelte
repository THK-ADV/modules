<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { Label } from '$lib/components/ui/label/index.js'
  import { Switch } from '$lib/components/ui/switch/index.js'
  import { Plus, Trash2 } from '@lucide/svelte'
  import { getModuleExamsContext, getModuleFormContext } from '../context'
  import { getModuleExams } from './module-exams.remote'

  let { id }: { id: string } = $props()

  const form = getModuleFormContext()
  const { form: formData, errors } = form
  const initExams = getModuleExamsContext()
  // svelte-ignore state_referenced_locally
  const loaded = await getModuleExams(id)

  // only live modules with own exams are editable
  if (loaded && loaded.examNames?.length !== 0) {
    initExams({ examNames: loaded.examNames })
  }

  const error = $derived(
    Object.values($errors.exams?.examNames ?? {})
      .flat()
      .find(Boolean)
  )

  function setNames(examNames: string[] | null) {
    $formData.exams = { examNames }
    // Superforms validates array paths at runtime, but its types only accept leaf paths.
    void form.validate('exams.examNames' as never)
  }
</script>

{#snippet hint(title: string, description: string)}
  <div class="space-y-2">
    <p class="text-foreground text-sm font-medium">{title}</p>
    <p class="text-muted-foreground text-sm">{description}</p>
  </div>
{/snippet}

{#if $formData.exams}
  <div class="space-y-5">
    <div class="flex items-center space-x-2">
      <Switch
        id="default-exam"
        checked={$formData.exams.examNames === null}
        onCheckedChange={(on) => setNames(on ? null : [...(loaded?.examNames ?? [''])])}
      />
      <Label for="default-exam">Wie Modulname: {loaded?.title}</Label>
    </div>
    {#if $formData.exams.examNames}
      {@const names = $formData.exams.examNames}
      <div class="space-y-3">
        <ul class="space-y-2" aria-label="Prüfungsnamen">
          {#each names, i (i)}
            <li class="flex gap-2">
              <Input
                value={names[i]}
                oninput={(event) => setNames(names.with(i, event.currentTarget.value))}
                aria-label="Prüfungsname {i + 1}"
                aria-invalid={!!error}
                placeholder="Prüfungsname eingeben"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Prüfungsname {i + 1} entfernen"
                disabled={names.length === 1}
                onclick={() => setNames(names.toSpliced(i, 1))}
              >
                <Trash2 class="size-4" aria-hidden="true" />
              </Button>
            </li>
          {/each}
        </ul>
        {#if error}
          <p class="text-destructive text-sm" aria-live="polite">{error}</p>
        {/if}
        <Button
          type="button"
          variant="outline"
          class="w-full sm:w-auto"
          onclick={() => setNames([...names, ''])}
        >
          <Plus class="mr-2 size-4" aria-hidden="true" />
          Prüfung hinzufügen
        </Button>
      </div>
    {/if}
  </div>
{:else if loaded}
  {@render hint(
    'Keine eigenen Modulprüfungen',
    'Bei Untermodulen erfolgt die Pflege am Obermodul, bei generischen Modulen an den einzahlenden Modulen.'
  )}
{:else}
  {@render hint(
    'Noch keine Modulprüfungen',
    'Modulprüfungen können erst gepflegt werden, wenn das Modul veröffentlicht ist und als Live-Modul vorliegt.'
  )}
{/if}
