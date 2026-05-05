<script lang="ts">
  import { File, type FileContents } from '@pierre/diffs'
  import { onDestroy } from 'svelte'
  import type { FileVersion } from './file-version'

  let { fileVersion }: { fileVersion: FileVersion } = $props()

  let instance: File | null = null

  const file: FileContents = $derived({
    name: fileVersion.id + '.yaml',
    contents: fileVersion.content
  })

  let container: HTMLDivElement

  $effect(() => {
    if (!container) return
    instance?.cleanUp()

    instance = new File({
      overflow: 'wrap',
      disableFileHeader: true
    })

    instance.render({ file, containerWrapper: container })
  })

  onDestroy(() => {
    instance?.cleanUp()
  })
</script>

<div bind:this={container} class="w-full min-w-0 overflow-x-auto"></div>
