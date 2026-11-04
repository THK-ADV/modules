<script lang="ts" module>
  import { MediaQuery } from 'svelte/reactivity'

  const wide = new MediaQuery('(min-width: 40rem)')
</script>

<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'
  import * as Popover from '$lib/components/ui/popover/index.js'
  import { RangeCalendar } from '$lib/components/ui/range-calendar/index.js'
  import type { DateRange } from '$lib/schemas/exam-list'
  import { fmtDate } from '$lib/formats'
  import { cn } from '$lib/utils'
  import { parseDate } from '@internationalized/date'
  import { Calendar } from '@lucide/svelte'
  import type { Snippet } from 'svelte'

  let {
    range,
    onchange,
    id,
    invalid = false,
    class: className,
    trigger,
    actions
  }: {
    range: DateRange | undefined
    onchange: (range: DateRange) => void
    id?: string
    invalid?: boolean
    class?: string
    /** Replaces the default button that shows the range. */
    trigger?: Snippet<[Record<string, unknown>]>
    /** Extra actions below the calendar, which receive a callback to close the popover. */
    actions?: Snippet<[close: () => void]>
  } = $props()

  let open = $state(false)
</script>

<Popover.Root bind:open>
  <Popover.Trigger {id}>
    {#snippet child({ props })}
      {#if trigger}
        {@render trigger(props)}
      {:else}
        <Button
          {...props}
          variant="outline"
          aria-invalid={invalid}
          class={cn(
            'aria-invalid:border-destructive justify-start px-2.5 font-normal',
            !range?.start && 'text-muted-foreground',
            className
          )}
        >
          <Calendar />
          {#if range?.start}
            {fmtDate(range.start)}{#if range.end}&nbsp;– {fmtDate(range.end)}{/if}
          {:else}
            Zeitraum wählen
          {/if}
        </Button>
      {/if}
    {/snippet}
  </Popover.Trigger>
  <Popover.Content class="w-auto p-0" align="start">
    <RangeCalendar
      locale="de-DE"
      numberOfMonths={wide.current ? 2 : 1}
      value={{
        start: range?.start ? parseDate(range.start) : undefined,
        end: range?.end ? parseDate(range.end) : undefined
      }}
      onValueChange={({ start, end }) => {
        if (start && end) onchange({ start: start.toString(), end: end.toString() })
      }}
    />
    {#if actions}
      <div class="flex flex-wrap gap-1 border-t p-2">{@render actions(() => (open = false))}</div>
    {/if}
  </Popover.Content>
</Popover.Root>
