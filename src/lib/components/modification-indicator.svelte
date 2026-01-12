<script lang="ts">
  import { Badge } from '$lib/components/ui/badge/index.js'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import type { ModificationStatus } from '$lib/types/module-draft-keys'
  import { Edit, Eye } from '@lucide/svelte'

  interface Props {
    status: ModificationStatus
    size?: 'sm' | 'md'
    iconOnly: boolean
    inline: boolean
  }

  let { status, size = 'sm', iconOnly, inline }: Props = $props()

  const sizeClasses = $derived(() => {
    switch (size) {
      case 'md':
        return 'text-sm px-2 py-1'
      case 'sm':
      default:
        return 'text-sm px-1.5 py-0.5'
    }
  })

  let tooltipContent = $derived.by(() => {
    switch (status) {
      case 'needs-review':
        return inline
          ? 'Dieser Datensatz wurde geändert und muss überprüft werden'
          : 'In diesem Abschnitt wurde ein Datensatz geändert und muss überprüft werden'
      case 'modified':
        return inline
          ? 'Dieser Datensatz wurde geändert'
          : 'In diesem Abschnitt wurde ein Datensatz geändert'
    }
  })
</script>

<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger>
      {#if status === 'needs-review'}
        <Badge
          variant="secondary"
          class="bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 {sizeClasses}"
        >
          {#if iconOnly}
            <Eye class="size-4" />
          {:else}
            <Eye class="mr-1 size-4" />
            Review
          {/if}
        </Badge>
      {:else if status === 'modified'}
        <Badge
          variant="secondary"
          class="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 {sizeClasses}"
        >
          {#if iconOnly}
            <Edit class="size-4" />
          {:else}
            <Edit class="mr-1 size-4" />
            Geändert
          {/if}
        </Badge>
      {/if}
    </Tooltip.Trigger>
    <Tooltip.Content>
      <p>{tooltipContent}</p>
    </Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
