<script lang="ts">
  import type { ComponentProps } from 'svelte'
  import { ArrowDown, ArrowUp, ArrowUpDown } from '@lucide/svelte'
  import { Button } from '$lib/components/ui/button/index.js'

  let {
    variant = 'ghost',
    fullText,
    shortText,
    sort = false,
    ...restProps
  }: ComponentProps<typeof Button> & {
    fullText: string
    shortText: string
    sort?: false | 'asc' | 'desc'
  } = $props()
</script>

<Button {variant} {...restProps} class="p-0">
  <span class="md:hidden">{shortText}</span>
  <span class="hidden md:inline">{fullText}</span>
  {#if sort === 'asc'}
    <ArrowUp />
  {:else if sort === 'desc'}
    <ArrowDown />
  {:else}
    <ArrowUpDown />
  {/if}
</Button>
