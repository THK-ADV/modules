<script lang="ts">
  import { cn } from '$lib/utils'

  let {
    size = 'md',
    class: className = '',
    ...restProps
  }: {
    size?: 'sm' | 'md' | 'lg'
    class?: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } & Record<string, any> = $props()

  const sizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }
</script>

<div
  class={cn(
    'animate-spin rounded-full border-2 border-transparent border-t-current opacity-60',
    sizeClasses[size],
    className
  )}
  {...restProps}
></div>
