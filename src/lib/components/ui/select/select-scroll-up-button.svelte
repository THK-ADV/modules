<script lang="ts">
  import ChevronUp from '@lucide/svelte/icons/chevron-up'
  import { Select as SelectPrimitive } from 'bits-ui'
  import { type WithoutChildrenOrChild } from '$lib/utils.js'
  import { cn } from '$lib/utils.js'

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: WithoutChildrenOrChild<SelectPrimitive.ScrollUpButtonProps> = $props()
</script>

<SelectPrimitive.ScrollUpButton
  bind:ref
  class={cn('flex cursor-default items-center justify-center py-1', className)}
  {...restProps}
>
  <ChevronUp class="size-4" />
</SelectPrimitive.ScrollUpButton>
