<script lang="ts">
  import type { FileChange } from '$lib/schemas/module-publication'
  import { FileDiff, processFile } from '@pierre/diffs'
  import { onDestroy } from 'svelte'

  let { file }: { file: FileChange } = $props()

  // GitLab returns only the hunks; the git header supplies file names and the change type.
  const fileDiff = $derived(
    processFile(
      [
        `diff --git a/${file.oldPath} b/${file.newPath}`,
        ...(file.newFile ? ['new file mode 100644'] : []),
        ...(file.deletedFile ? ['deleted file mode 100644'] : []),
        `--- ${file.newFile ? '/dev/null' : `a/${file.oldPath}`}`,
        `+++ ${file.deletedFile ? '/dev/null' : `b/${file.newPath}`}`,
        file.diff
      ].join('\n'),
      { isGitDiff: true }
    )
  )

  let container: HTMLDivElement
  let instance: FileDiff | null = null

  $effect(() => {
    if (!container || !fileDiff) return
    instance?.cleanUp()
    instance = new FileDiff({ diffStyle: 'unified', overflow: 'wrap' })
    instance.render({ fileDiff, containerWrapper: container })
  })

  onDestroy(() => {
    instance?.cleanUp()
  })
</script>

<div bind:this={container} class="w-full min-w-0"></div>
