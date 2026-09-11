<script lang="ts">
  import type { StudyProgramFilterOption } from '$lib/components/study-program-filter'
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { buttonVariants } from '$lib/components/ui/button/index.js'
  import * as Command from '$lib/components/ui/command/index.js'
  import * as Form from '$lib/components/ui/form/index.js'
  import * as Popover from '$lib/components/ui/popover/index.js'
  import { cn } from '$lib/utils.js'
  import { Check, ChevronsUpDown } from '@lucide/svelte'

  interface Props {
    form: any // eslint-disable-line @typescript-eslint/no-explicit-any
    name: string
    label: string
    description: string
    options: StudyProgramFilterOption[]
    value: string[]
    disabled?: boolean
  }

  let { form, name, label, description, options, value = $bindable(), disabled }: Props = $props()

  let open = $state(false)

  const sortedOptions = $derived.by(() => {
    const selected = new Set(value)
    return [
      ...options.filter((option) => selected.has(option.id)),
      ...options.filter((option) => !selected.has(option.id))
    ]
  })

  function toggle(id: string) {
    value = value.includes(id) ? value.filter((entry) => entry !== id) : [...value, id]
    form.validate(name)
  }

  function clear() {
    value = []
    form.validate(name)
  }
</script>

<Form.Field {form} {name}>
  <Popover.Root bind:open>
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>{label}</Form.Label>
        <Popover.Trigger
          role="combobox"
          class={cn(
            buttonVariants({ variant: 'outline' }),
            'h-auto min-h-10 w-full justify-start px-3 py-2 text-left font-normal'
          )}
          {...props}
          {disabled}
        >
          {#if value.length === 0}
            <span class="text-muted-foreground">Kein Kontext</span>
          {:else}
            <div class="flex min-w-0 flex-1 flex-wrap gap-1">
              {#each value as id (id)}
                <Badge variant="secondary" class="rounded-sm px-1 font-normal">{id}</Badge>
              {/each}
            </div>
          {/if}
          <ChevronsUpDown class="ml-auto size-4 shrink-0 self-center opacity-50" />
        </Popover.Trigger>
        <input hidden value={value.join(',')} name={props.name} />
      {/snippet}
    </Form.Control>
    <Popover.Content class="w-[var(--bits-popover-anchor-width)] p-0" align="start">
      <Command.Root>
        <Command.Input placeholder="Suchen…" class="h-8 border-0 shadow-none focus:ring-0" />
        <Command.List>
          <Command.Empty>Keine Ergebnisse</Command.Empty>
          {#if value.length > 0}
            <Command.Separator />
            <Command.Item class="justify-center text-center" onSelect={clear}>
              Auswahl zurücksetzen
            </Command.Item>
          {/if}
          <Command.Group>
            {#each sortedOptions as option (option.id)}
              <Command.Item
                value={option.id}
                keywords={[...option.searchKeywords]}
                class="items-start gap-2 py-2 pr-1"
                onSelect={() => toggle(option.id)}
              >
                <div
                  class={cn(
                    'border-primary mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm border',
                    value.includes(option.id)
                      ? 'bg-primary text-primary-foreground'
                      : 'opacity-50 [&_svg]:invisible'
                  )}
                >
                  <Check class="size-4" />
                </div>
                <div
                  class="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                >
                  <span class="min-w-0 text-sm leading-snug font-medium wrap-break-word">
                    {option.label}
                  </span>
                  <div class="flex shrink-0 flex-wrap items-center gap-1 sm:justify-end sm:pl-1">
                    <Badge
                      variant="outline"
                      class="text-muted-foreground h-5 shrink-0 rounded-sm px-1.5 text-[0.6875rem] font-normal"
                    >
                      {option.studyProgram.degree.deLabel}
                    </Badge>
                    <Badge
                      variant="outline"
                      class="text-muted-foreground h-5 shrink-0 rounded-sm px-1.5 text-[0.6875rem] font-normal"
                    >
                      PO{option.studyProgram.po.version}
                    </Badge>
                  </div>
                </div>
              </Command.Item>
            {/each}
          </Command.Group>
        </Command.List>
      </Command.Root>
    </Popover.Content>
  </Popover.Root>
  <Form.Description>{description}</Form.Description>
</Form.Field>
