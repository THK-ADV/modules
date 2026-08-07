<script lang="ts">
  import { ModulePreviewPlaceholder } from '$lib/components/module-detail'
  import type { PageProps } from './$types'

  let { data, params }: PageProps = $props()
</script>

<div class="mx-auto min-h-[calc(100vh-7rem)] max-w-3xl lg:overflow-hidden lg:rounded-lg lg:border">
  <ModulePreviewPlaceholder id={params.id} moduleDraftState={data.moduleDraftState} />
</div>
