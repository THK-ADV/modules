<script lang="ts">
  import type { ModuleDetail } from '$lib/types/module-details'
  import { marked } from 'marked'
  import type { PageProps } from './$types'

  let { data }: PageProps = $props()
  let module: ModuleDetail = data.module
</script>

{#snippet markdownContent(title: string, body: string)}
  <h2>{title}</h2>
  {#if body}
    <div>{@html marked.parse(body)}</div>
  {:else}
    <p>Keine Angabe</p>
  {/if}
{/snippet}

<div class="prose max-w-none">
  <h1>{module.title}</h1>

  <!-- TODO: render more data -->

  {@render markdownContent('Angestrebte Lernergebnisse', module.content.learningOutcome)}
  {@render markdownContent('Modulinhalte', module.content.moduleContent)}
  {@render markdownContent('Lehr- und Lernmethoden (Medienformen)', module.content.learningMethods)}
  {@render markdownContent('Empfohlene Literatur', module.content.literature)}
  {@render markdownContent('Besonderheiten', module.content.particularities)}

  <!-- <div>{@html marked.parse(page)}</div> -->
</div>
