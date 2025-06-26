<script lang="ts">
  import type { PageProps } from './$types'
  let { data }: PageProps = $props()
</script>

<div>{@html data.file}</div>
