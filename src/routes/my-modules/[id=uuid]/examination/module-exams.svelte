<script lang="ts">
  import { resolve } from '$app/paths'
  import { ArrowUpRight } from '@lucide/svelte'
  import { getModuleExams } from './module-exams.remote'

  let { id, canManage }: { id: string; canManage: boolean } = $props()

  const loaded = $derived(await getModuleExams(id))
</script>

{#snippet hint(title: string, description: string)}
  <div class="space-y-2">
    <p class="text-foreground text-sm font-medium">{title}</p>
    <p class="text-muted-foreground text-sm">{description}</p>
  </div>
{/snippet}

<div class="space-y-3">
  {#if !loaded}
    {@render hint(
      'Noch keine Modulprüfungen',
      'Prüfungen werden zugeordnet, sobald das Modul veröffentlicht ist und als Live-Modul vorliegt.'
    )}
  {:else if !loaded.hasOwnExams}
    {@render hint(
      'Keine eigenen Modulprüfungen',
      'Bei Untermodulen erfolgt die Prüfung über das Obermodul, bei generischen Modulen über die einzahlenden Module.'
    )}
  {:else if !loaded.exams.length}
    {@render hint(
      'Keine Prüfung zugeordnet',
      'Dem Modul ist noch keine Prüfung zugeordnet. Die Zuordnung erfolgt in der Prüfungsplanung.'
    )}
  {:else}
    <ul class="divide-y rounded-lg border" aria-label="Prüfungen des Moduls">
      {#each loaded.exams as exam (exam.id)}
        {@const others = exam.modules.filter((m) => m.id !== id)}
        <li class="space-y-1 px-4 py-3">
          <p class="text-sm font-medium wrap-anywhere">{exam.name}</p>
          {#if others.length}
            <p class="text-muted-foreground text-xs">
              Auch in {others.map((m) => `${m.title} (${m.abbrev})`).join(', ')}
            </p>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}

  {#if canManage}
    <a
      href={resolve('/planning/exam/exams')}
      class="text-primary inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
    >
      Prüfungen verwalten
      <ArrowUpRight class="size-4" aria-hidden="true" />
    </a>
  {/if}
</div>
