<script lang="ts">
  import { buttonVariants } from '$lib/components/ui/button/index.js'
  import { cn } from '$lib/utils.js'
  import { Calendar as CalendarPrimitive } from 'bits-ui'

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: CalendarPrimitive.DayProps = $props()
</script>

<CalendarPrimitive.Day
  bind:ref
  class={cn(
    buttonVariants({ variant: 'ghost' }),
    'size-9 p-0 font-normal',
    '[&[data-today]:not([data-selected])]:bg-accent [&[data-today]:not([data-selected])]:text-accent-foreground',
    // Selected
    'data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:hover:bg-primary data-[selected]:hover:text-primary-foreground data-[selected]:focus:bg-primary data-[selected]:focus:text-primary-foreground data-[selected]:opacity-100',
    // Disabled
    'data-[disabled]:text-muted-foreground data-[disabled]:opacity-50',
    // Unavailable — light: soft blush tint + destructive text; dark: bright red-400 text + stronger tint to compensate for dark surface
    'data-[unavailable]:line-through data-[unavailable]:decoration-2 data-[unavailable]:opacity-90',
    'data-[unavailable]:text-destructive data-[unavailable]:decoration-destructive data-[unavailable]:bg-destructive/10 data-[unavailable]:hover:bg-destructive/[0.15]',
    'dark:data-[unavailable]:bg-red-500/[0.22] dark:data-[unavailable]:text-red-400 dark:data-[unavailable]:decoration-red-400 dark:data-[unavailable]:hover:bg-red-500/[0.32]',
    // Outside months
    'data-[outside-month]:text-muted-foreground [&[data-outside-month][data-selected]]:bg-accent/50 [&[data-outside-month][data-selected]]:text-muted-foreground data-[outside-month]:pointer-events-none data-[outside-month]:opacity-50 [&[data-outside-month][data-selected]]:opacity-30',
    className
  )}
  {...restProps}
/>
