<script lang="ts">
  import ChevronDown from '@lucide/svelte/icons/chevron-down'
  import { Select as SelectPrimitive } from 'bits-ui'
  import { type WithoutChildrenOrChild } from '$lib/utils.js'
  import { cn } from '$lib/utils.js'

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: WithoutChildrenOrChild<SelectPrimitive.ScrollDownButtonProps> = $props()
</script>

<SelectPrimitive.ScrollDownButton
  bind:ref
  class={cn('flex cursor-default items-center justify-center py-1', className)}
  {...restProps}
>
  <ChevronDown class="size-4" />
</SelectPrimitive.ScrollDownButton>
