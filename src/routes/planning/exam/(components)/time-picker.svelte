<script lang="ts">
  import { Button, buttonVariants } from '$lib/components/ui/button/index.js'
  import * as Popover from '$lib/components/ui/popover/index.js'
  import { ScrollArea } from '$lib/components/ui/scroll-area/index.js'
  import { cn } from '$lib/utils'
  import { Clock } from '@lucide/svelte'

  /** Time of day as `HH:mm`, chosen by hour and five-minute step like the booking dialog. */
  let { id, value = $bindable() }: { id: string; value: string } = $props()

  const pad = (n: number) => String(n).padStart(2, '0')
  const hours = Array.from({ length: 16 }, (_, i) => pad(i + 7))
  const minutes = Array.from({ length: 12 }, (_, i) => pad(i * 5))
  const [hour, minute] = $derived(value ? value.split(':') : [])
</script>

{#snippet column(
  label: string,
  items: string[],
  selected: string | undefined,
  pick: (item: string) => string
)}
  <ScrollArea class="w-16">
    <div class="flex flex-col p-2" role="group" aria-label={label}>
      {#each items as item (item)}
        <Button
          variant={item === selected ? 'default' : 'ghost'}
          size="sm"
          class="w-full shrink-0"
          aria-pressed={item === selected}
          onclick={() => (value = pick(item))}
          {@attach (node: HTMLElement) => {
            if (item === selected) node.scrollIntoView({ block: 'center' })
          }}
        >
          {item}
        </Button>
      {/each}
    </div>
  </ScrollArea>
{/snippet}

<Popover.Root>
  <Popover.Trigger
    {id}
    class={cn(
      buttonVariants({ variant: 'outline' }),
      'h-9 w-full justify-start font-normal',
      !value && 'text-muted-foreground'
    )}
  >
    <Clock class="size-4" aria-hidden="true" />
    {value || 'Uhrzeit auswählen'}
  </Popover.Trigger>
  <Popover.Content class="w-auto p-0" align="start">
    <div class="flex h-[300px] divide-x">
      {@render column('Stunde', hours, hour, (h) => `${h}:${minute ?? '00'}`)}
      {@render column('Minute', minutes, minute, (m) => `${hour ?? hours[1]}:${m}`)}
    </div>
  </Popover.Content>
</Popover.Root>
