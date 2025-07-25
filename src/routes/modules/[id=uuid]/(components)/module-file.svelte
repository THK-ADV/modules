<script lang="ts">
  const { file }: { file: string } = $props()
</script>

<!-- eslint-disable-next-line svelte/no-at-html-tags -->
<div>{@html file}</div>
