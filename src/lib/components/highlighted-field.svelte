<script lang="ts">
  import ModificationIndicator from './modification-indicator.svelte'
  import { getFieldHighlightClasses, type ModificationStatus } from '$lib/types/module-draft-keys'
  import type { Snippet } from 'svelte'

  interface Props {
    status: ModificationStatus
    label: string
    children: Snippet<[]>
  }

  let { status, label, children }: Props = $props()
</script>

<div class="space-y-2 {getFieldHighlightClasses(status)}">
  <div class="flex items-center justify-between">
    <span class="text-sm font-medium text-foreground">{label}</span>
    <ModificationIndicator {status} iconOnly={false} inline={true} />
  </div>
  {@render children()}
</div>
