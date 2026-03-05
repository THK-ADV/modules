<script lang="ts">
  import { Button, buttonVariants } from '$lib/components/ui/button/index.js'
  import { Calendar } from '$lib/components/ui/calendar/index.js'
  import * as Form from '$lib/components/ui/form/index.js'
  import * as Popover from '$lib/components/ui/popover/index.js'
  import { ScrollArea } from '$lib/components/ui/scroll-area/index.js'
  import { cn } from '$lib/utils'
  import { DateFormatter, fromDate, getLocalTimeZone } from '@internationalized/date'
  import { Calendar1 } from '@lucide/svelte'

  interface Props {
    form: any // eslint-disable-line @typescript-eslint/no-explicit-any
    name: string
    label: string
    placeholder?: string
    description?: string
    value: Date | null
    errors?: any // eslint-disable-line @typescript-eslint/no-explicit-any
    disabled?: boolean
    hourRange?: { start: number; end: number }
    minuteIntervals?: number[]
    onUpdate?: (date: Date) => void
  }

  let {
    form,
    name,
    label,
    placeholder = 'Datum & Uhrzeit…',
    description,
    value = $bindable(),
    errors = {},
    disabled = false,
    hourRange = { start: 8, end: 21 },
    minuteIntervals = [0, 15, 30, 45],
    onUpdate
  }: Props = $props()

  const df = new DateFormatter('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  // Current selection
  let selectedHour = $derived(value ? value.getHours() : hourRange.start)
  let selectedMinute = $derived(
    value ? value.getMinutes() : minuteIntervals ? minuteIntervals[0] : 0
  )

  const hours = $derived(
    Array.from({ length: hourRange.end - hourRange.start + 1 }, (_, i) => {
      const hour = i + hourRange.start
      return { value: hour, label: hour.toString().padStart(2, '0') }
    })
  )

  const minutes = $derived(
    minuteIntervals.map((m) => ({ value: m, label: m.toString().padStart(2, '0') }))
  )

  function updateDateTime(date: Date | null) {
    if (!date) return null
    const newDate = new Date(date)
    newDate.setHours(selectedHour, selectedMinute, 0, 0)
    value = newDate
    onUpdate?.(newDate)
  }

  function formatDateTime(date: Date | null): string {
    if (!date) return placeholder
    return df.format(date)
  }
</script>

<Form.Field {form} {name}>
  <Popover.Root>
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>{label}</Form.Label>
        <Popover.Trigger
          {disabled}
          class={cn(
            buttonVariants({ variant: 'outline' }),
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            errors[name] && 'border-destructive',
            disabled && 'cursor-not-allowed opacity-50'
          )}
          {...props}
        >
          <Calendar1 class="size-4" />
          {formatDateTime(value)}
        </Popover.Trigger>
        <input hidden value={value?.toISOString() ?? ''} name={props.name} />
      {/snippet}
    </Form.Control>
    <Popover.Content class="w-auto p-0" align="start">
      <div class="flex">
        <Calendar
          value={value ? fromDate(value, getLocalTimeZone()) : undefined}
          type="single"
          initialFocus
          locale="de"
          weekStartsOn={1}
          onValueChange={(v) => {
            if (v) {
              updateDateTime(v.toDate(getLocalTimeZone()))
            }
          }}
        />
        <div class="flex h-[300px] divide-x border-l">
          <ScrollArea class="w-16">
            <div class="flex flex-col p-2">
              {#each hours as { value: hour, label } (hour)}
                <Button
                  variant={selectedHour === hour ? 'default' : 'ghost'}
                  size="sm"
                  class="w-full shrink-0"
                  onclick={() => {
                    selectedHour = hour
                    if (value) {
                      updateDateTime(value)
                    }
                  }}
                >
                  {label}
                </Button>
              {/each}
            </div>
          </ScrollArea>
          <ScrollArea class="w-16">
            <div class="flex flex-col p-2">
              {#each minutes as { value: minute, label } (minute)}
                <Button
                  variant={selectedMinute === minute ? 'default' : 'ghost'}
                  size="sm"
                  class="w-full shrink-0"
                  onclick={() => {
                    selectedMinute = minute
                    if (value) {
                      updateDateTime(value)
                    }
                  }}
                >
                  {label}
                </Button>
              {/each}
            </div>
          </ScrollArea>
        </div>
      </div>
    </Popover.Content>
  </Popover.Root>
  {#if description}
    <Form.Description>{description}</Form.Description>
  {/if}
  <Form.FieldErrors />
</Form.Field>
