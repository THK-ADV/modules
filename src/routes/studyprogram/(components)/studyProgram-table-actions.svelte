<script lang="ts" module>
  export type PreviewActionKey =
    | 'previewModuleCatalog'
    | 'previewExamList'
    | 'createModuleCatalog'
    | 'previewExamLoad'
  export type ActionKey = PreviewActionKey | 'releaseExamList' | 'uploadModuleCatalogIntroduction'

  export interface Action {
    key: ActionKey
    label: string
    Icon: Component<IconProps, object, ''>
    onclick: () => void
    variant: ButtonVariant
    className: string
  }
</script>

<script lang="ts">
  import Button, { type ButtonVariant } from '$lib/components/ui/button/button.svelte'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index'
  import { cn } from '$lib/utils'
  import { Ellipsis, type IconProps } from '@lucide/svelte'
  import type { Component } from 'svelte'

  let { actions }: { actions: Action[] } = $props()
</script>

{#snippet buttonRow({ className, variant, onclick, label, Icon }: Action)}
  <Button
    {variant}
    size="sm"
    class={cn('font-medium shadow-sm transition-colors', className)}
    {onclick}
  >
    <Icon class="size-4" />
    {label}
  </Button>
{/snippet}

{#snippet buttonMenuItem({ key, onclick, label, Icon }: Action)}
  <DropdownMenu.Item
    class={cn(
      'flex cursor-pointer items-center gap-2 font-medium',
      key === 'previewModuleCatalog' && 'text-gray-600 focus:text-gray-700',
      key === 'createModuleCatalog' && 'text-gray-600 focus:text-gray-700',
      key === 'previewExamList' && 'text-gray-600 focus:text-gray-700',
      key === 'previewExamLoad' && 'text-gray-600 focus:text-gray-700',
      key === 'uploadModuleCatalogIntroduction' && 'text-gray-600 focus:text-gray-700',
      key === 'releaseExamList' && 'text-green-600 focus:text-green-700'
    )}
    {onclick}
  >
    <Icon class="size-4" />
    {label}
  </DropdownMenu.Item>
{/snippet}

<!-- Desktop: Show all actions inline -->
<div class="hidden items-center gap-1 lg:flex">
  <div class="flex items-center gap-1">
    {#each actions as action (action.key)}
      {@render buttonRow(action)}
    {/each}
  </div>
</div>

<!-- Mobile: Dropdown menu -->
<div class="lg:hidden">
  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        <Button
          {...props}
          variant="outline"
          size="sm"
          class="size-7 border-gray-200 p-0 shadow-sm hover:border-gray-300 hover:bg-gray-50"
        >
          <span class="sr-only">Aktionen öffnen</span>
          <Ellipsis class="size-4" />
        </Button>
      {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end" class="w-56">
      <DropdownMenu.Group>
        <DropdownMenu.GroupHeading>Aktionen</DropdownMenu.GroupHeading>
        {#each actions as action (action.key)}
          {@render buttonMenuItem(action)}
        {/each}
      </DropdownMenu.Group>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</div>
