<script lang="ts">
  import { Badge } from '$lib/components/ui/badge/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import { fmtStudyProgram } from '$lib/formats'
  import type { StudyProgram } from '$lib/types/study-program'

  let { context, studyPrograms }: { context: string[]; studyPrograms: Map<string, StudyProgram> } =
    $props()
</script>

{#if context.length === 0}
  <span class="text-muted-foreground">–</span>
{:else}
  <Tooltip.Provider>
    <div class="flex flex-wrap gap-1">
      {#each context as id (id)}
        {@const studyProgram = studyPrograms.get(id)}
        <Tooltip.Root>
          <Tooltip.Trigger>
            <Badge variant="secondary" class="rounded-sm px-1.5 font-normal">{id}</Badge>
          </Tooltip.Trigger>
          <Tooltip.Content>
            {studyProgram ? fmtStudyProgram(studyProgram) : 'Nicht mehr verfügbar'}
          </Tooltip.Content>
        </Tooltip.Root>
      {/each}
    </div>
  </Tooltip.Provider>
{/if}
