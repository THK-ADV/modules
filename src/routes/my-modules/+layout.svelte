<script lang="ts">
  import { page } from '$app/state'

  let { children } = $props()
</script>

<!-- recreate the module editor state if another module or mode is opened -->
{#key `${page.params.id}:${page.url.searchParams.get('mode')}`}
  {@render children()}
{/key}
