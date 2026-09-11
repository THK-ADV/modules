<script lang="ts">
  import { Button, buttonVariants } from '$lib/components/ui/button/index.js'
  import { Calendar } from '$lib/components/ui/calendar/index.js'
  import * as Form from '$lib/components/ui/form/index.js'
  import * as Popover from '$lib/components/ui/popover/index.js'
  import { cn } from '$lib/utils'
  import { DateFormatter, getLocalTimeZone, parseDate } from '@internationalized/date'
  import { Calendar1 } from '@lucide/svelte'

  interface Props {
    form: any // eslint-disable-line @typescript-eslint/no-explicit-any
    name: string
    label: string
    value: string
    clearable?: boolean
    disabled?: boolean
  }

  let {
    form,
    name,
    label,
    value = $bindable(),
    clearable = false,
    disabled = false
  }: Props = $props()
  let open = $state(false)
  const dateFormatter = new DateFormatter('de-DE', { dateStyle: 'medium' })
  const calendarValue = $derived(value ? parseDate(value) : undefined)
</script>

<Form.Field {form} {name}>
  <Popover.Root bind:open>
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>{label}</Form.Label>
        <Popover.Trigger
          {...props}
          {disabled}
          class={cn(
            buttonVariants({ variant: 'outline' }),
            'h-10 w-full justify-start text-left font-normal aria-invalid:border-destructive',
            !value && 'text-muted-foreground'
          )}
        >
          <Calendar1 class="size-4" />
          {calendarValue
            ? dateFormatter.format(calendarValue.toDate(getLocalTimeZone()))
            : 'Datum auswählen…'}
        </Popover.Trigger>
        <input type="hidden" {value} name={props.name} />
      {/snippet}
    </Form.Control>
    <Popover.Content class="w-auto p-0" align="start">
      <Calendar
        type="single"
        value={calendarValue}
        locale="de"
        weekStartsOn={1}
        {disabled}
        onValueChange={(date) => {
          if (date) {
            value = date.toString()
            open = false
          }
        }}
      />
      {#if clearable && value}
        <div class="border-t p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            class="w-full"
            {disabled}
            onclick={() => {
              value = ''
              open = false
            }}>Datum entfernen</Button
          >
        </div>
      {/if}
    </Popover.Content>
  </Popover.Root>
  <Form.FieldErrors />
</Form.Field>
