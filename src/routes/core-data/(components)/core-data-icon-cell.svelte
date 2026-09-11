<script lang="ts">
  import { cn } from '$lib/utils.js'
  import type { IconProps } from '@lucide/svelte'
  import type { Component } from 'svelte'

  let {
    icon: Icon,
    label,
    class: className
  }: {
    icon: Component<IconProps>
    label: string
    class?: string
  } = $props()
</script>

<span
  title={label}
  aria-label={label}
  role="img"
  class="inline-flex size-4 shrink-0 items-center justify-center"
>
  <Icon class={cn('size-4', className)} aria-hidden="true" />
</span>
