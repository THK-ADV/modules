<script lang="ts">
  import { FileDiff, type FileContents } from '@pierre/diffs'
  import { onDestroy } from 'svelte'
  import type { FileVersionComparison } from './file-version'

  let { comparison }: { comparison: FileVersionComparison } = $props()

  let instance: FileDiff | null = null

  const oldFile: FileContents = $derived({
    name: comparison.oldFileVersion.id + '.yaml',
    contents: comparison.oldFileVersion.content
  })

  const newFile: FileContents = $derived({
    name: comparison.newFileVersion.id + '.yaml',
    contents: comparison.newFileVersion.content
  })

  let container: HTMLDivElement

  $effect(() => {
    if (!container) return
    instance?.cleanUp()

    instance = new FileDiff({
      diffStyle: 'split'
    })

    instance.render({
      oldFile,
      newFile,
      containerWrapper: container
    })
  })

  onDestroy(() => {
    instance?.cleanUp()
  })
</script>

<div bind:this={container} class="w-full min-w-0 overflow-x-auto"></div>
