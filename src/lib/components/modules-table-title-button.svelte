<script lang="ts">
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import { cn } from '$lib/utils.js';
  import type { Column } from '@tanstack/table-core';
  import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff } from 'lucide-svelte';
  import type { ModuleView } from '$lib/types/module'

  interface Props {
    column: Column<ModuleView, unknown>;
    title: string;
    class?: string;
  }

  let { column, title, class: className }: Props = $props();
</script>

{#if !column.getCanSort()}
  <div class={cn(className)}>{title}</div>
{:else}
  <div class={cn('flex items-center', className)}>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground -ml-3 h-8 px-3 data-[state=open]:bg-accent">
          <span>{title}</span>
          {#if column.getIsSorted() === 'desc'}
            <ArrowDown class="ml-2 h-4 w-4" />
          {:else if column.getIsSorted() === 'asc'}
            <ArrowUp class="ml-2 h-4 w-4" />
          {:else}
            <ChevronsUpDown class="ml-2 h-4 w-4" />
          {/if}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="start">
        <DropdownMenu.Item onclick={() => column.toggleSorting(false)}>
          <ArrowUp class="text-muted-foreground/70 mr-2 h-3.5 w-3.5" />
          Aufsteigend
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => column.toggleSorting(true)}>
          <ArrowDown class="text-muted-foreground/70 mr-2 h-3.5 w-3.5" />
          Absteigend
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </div>
{/if}
