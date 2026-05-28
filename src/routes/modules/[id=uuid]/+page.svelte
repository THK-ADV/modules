<script lang="ts">
  import type { PageProps } from './$types'
  import ModuleDetail from './(components)/module-detail.svelte'

  let { data }: PageProps = $props()
  const { module, genericModuleOptions, isGenericModule, isAuthenticated } = $derived(data)
</script>

{#if module}
  <ModuleDetail
    {module}
    {genericModuleOptions}
    {isGenericModule}
    isAuthenticated={isAuthenticated ?? false}
  />
{/if}
