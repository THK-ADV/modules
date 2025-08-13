<script lang="ts">
  import type { ModuleType } from '$lib/types/module'
  import { CircleFadingPlus, CircleHelp, CirclePlus } from '@lucide/svelte'

  let { moduleType }: { moduleType: ModuleType | undefined } = $props()

  const { label, abbrev, Icon } = $derived.by(() => {
    switch (moduleType?.id) {
      case 'pm':
        return { label: moduleType.label, abbrev: moduleType.abbrev, Icon: CirclePlus }
      case 'wm':
        return { label: moduleType.label, abbrev: moduleType.abbrev, Icon: CircleHelp }
      case 'pwm':
        return { label: moduleType.label, abbrev: moduleType.abbrev, Icon: CircleFadingPlus }
      default:
        return { label: '???', abbrev: '???', Icon: undefined }
    }
  })
</script>

<div class="flex items-center">
  {#if Icon}
    <!-- The flex-shrink-0 will prevent the icon from shrinking if space is limited -->
    <Icon class="mr-2 h-4 w-4 flex-shrink-0 text-muted-foreground" />
  {/if}
  <span class="hidden md:inline">{label}</span>
  <span class="inline md:hidden">{abbrev}</span>
</div>
