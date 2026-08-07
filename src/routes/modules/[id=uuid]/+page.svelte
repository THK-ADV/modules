<script lang="ts">
  import { ModuleDetail } from '$lib/components/module-detail'
  import type { PageProps } from './$types'

  let { data }: PageProps = $props()
  const { module, genericModuleOptions, isAuthenticated } = $derived(data)
</script>

{#if module}
  <ModuleDetail {module} {genericModuleOptions} isAuthenticated={isAuthenticated ?? false} />
{/if}
