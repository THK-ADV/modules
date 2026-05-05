<script lang="ts">
  import type { PageProps } from './$types'
  import ModuleDetail from './(components)/module-detail.svelte'
  import ModuleFile from './(components)/module-file.svelte'

  let { data }: PageProps = $props()
  const { file, module, genericModuleOptions, isGenericModule, accessToken } = $derived(data)
</script>

{#if file}
  <ModuleFile {file} />
{:else if module && genericModuleOptions}
  <ModuleDetail {module} {genericModuleOptions} {isGenericModule} isAuthenticated={!!accessToken} />
{/if}
