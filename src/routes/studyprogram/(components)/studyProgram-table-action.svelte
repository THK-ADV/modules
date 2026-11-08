<script lang="ts">
  import { Button, type ButtonProps } from '$lib/components/ui/button'
  import type { IconProps } from '@lucide/svelte'
  import type { Component } from 'svelte'

  let {
    Icon,
    label,
    ...rest
  }: ButtonProps & { Icon: Component<IconProps, object, ''>; label: string } = $props()
</script>

<Button
  {...rest}
  variant="outline"
  size="sm"
  class="border-gray-300 font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-800"
>
  <Icon />
  {label}
</Button>
