<script lang="ts">
  import { sanitizeHtml } from '$lib/markdown'

  const { file }: { file: string } = $props()
</script>

<!-- eslint-disable-next-line svelte/no-at-html-tags -->
<div>{@html sanitizeHtml(file)}</div>
