<script lang="ts">
  import type { ModuleType } from '$lib/types/module'
  import { CircleFadingPlus, CircleQuestionMark, CirclePlus } from '@lucide/svelte'

  let { moduleType }: { moduleType: ModuleType | undefined } = $props()

  const { label, abbrev, Icon } = $derived.by(() => {
    switch (moduleType?.id) {
      case 'pm':
        return { label: moduleType.label, abbrev: moduleType.abbrev, Icon: CirclePlus }
      case 'wm':
        return { label: moduleType.label, abbrev: moduleType.abbrev, Icon: CircleQuestionMark }
      case 'pwm':
        return { label: moduleType.label, abbrev: moduleType.abbrev, Icon: CircleFadingPlus }
      default:
        return { label: '???', abbrev: '???', Icon: undefined }
    }
  })
</script>

<div class="flex items-center">
  {#if Icon}
    <!-- The shrink-0 will prevent the icon from shrinking if space is limited -->
    <Icon class="text-muted-foreground mr-2 size-4 shrink-0" />
  {/if}
  <span class="hidden md:inline">{label}</span>
  <span class="inline md:hidden">{abbrev}</span>
</div>
