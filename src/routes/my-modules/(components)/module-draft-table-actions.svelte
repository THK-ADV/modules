<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import Button, { type ButtonVariant } from '$lib/components/ui/button/button.svelte'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index'
  import * as Separator from '$lib/components/ui/separator/index'
  import type { ModuleDraftState } from '$lib/types/module-draft'
  import { cn } from '$lib/utils'
  import { Edit, Ellipsis, Eye, Shield, Trash2, Upload, X, type IconProps } from '@lucide/svelte'
  import type { Component } from 'svelte'

  interface Props {
    moduleId: string
    state: ModuleDraftState
    isPrivilegedForModule: boolean
  }

  interface Action {
    key: string
    label: string
    Icon: Component<IconProps, object, ''>
    onclick: () => void
    variant: ButtonVariant
    className: string
  }

  function canEdit(state: ModuleDraftState) {
    return (
      state === 'valid_for_review' ||
      state === 'valid_for_publication' ||
      state === 'published' ||
      state === 'waiting_for_changes'
    )
  }
  function canPublish(state: ModuleDraftState) {
    return state === 'valid_for_publication'
  }
  function canRequestReview(state: ModuleDraftState) {
    return state === 'valid_for_review'
  }
  function canCancelReview(state: ModuleDraftState) {
    return state === 'waiting_for_review'
  }
  function canDiscardChanges(state: ModuleDraftState) {
    return (
      state === 'valid_for_review' ||
      state === 'valid_for_publication' ||
      state === 'waiting_for_changes'
    )
  }

  let { moduleId, state, isPrivilegedForModule }: Props = $props()

  let moduleActions = $derived.by(() => {
    const actions = new Array<Action>()

    if (canEdit(state)) {
      actions.push({
        key: 'edit',
        label: 'Bearbeiten',
        Icon: Edit,
        onclick: () => goto(`${page.url.pathname}/${moduleId}`),
        variant: 'outline',
        className: 'border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800'
      })
    }

    if (canPublish(state)) {
      actions.push({
        key: 'publish',
        label: 'Änderungen übernehmen',
        Icon: Upload,
        onclick: () => {},
        variant: 'default',
        className: 'bg-green-600 hover:bg-green-700'
      })
    }

    if (canRequestReview(state)) {
      actions.push({
        key: 'requestReview',
        label: 'Review anfragen',
        Icon: Eye,
        onclick: () => {},
        variant: 'outline',
        className: 'border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800'
      })
    }

    if (canCancelReview(state)) {
      actions.push({
        key: 'cancelReview',
        label: 'Review zurückziehen',
        Icon: X,
        onclick: () => {},
        variant: 'outline',
        className: 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-800'
      })
    }

    if (canDiscardChanges(state)) {
      actions.push({
        key: 'discardChanges',
        label: 'Änderungen verwerfen',
        Icon: Trash2,
        onclick: () => {},
        variant: 'outline',
        className: 'border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800'
      })
    }

    return actions
  })

  let adminActions = $derived.by(() => {
    const actions = new Array<Action>()

    if (isPrivilegedForModule) {
      actions.push({
        key: 'managePermissions',
        label: 'Bearbeitungsrechte setzen',
        Icon: Shield,
        onclick: () => {},
        variant: 'outline',
        className: 'border-purple-300 text-purple-700 hover:bg-purple-50 hover:text-purple-800'
      })
    }

    return actions
  })

  let hasModuleActions = $derived(moduleActions.length > 0)
  let hasAdminActions = $derived(adminActions.length > 0)
  let hasAnyActions = $derived(hasModuleActions || hasAdminActions)
</script>

{#snippet buttonRow({ className, variant, onclick, label, Icon }: Action)}
  <Button
    {variant}
    size="sm"
    class={cn('font-medium shadow-sm transition-colors', className)}
    {onclick}
  >
    <Icon class="mr-1.5 h-3.5 w-3.5" />
    {label}
  </Button>
{/snippet}

{#snippet buttonMenuItem({ key, onclick, label, Icon }: Action)}
  <DropdownMenu.Item
    class={cn(
      'flex cursor-pointer items-center gap-2 font-medium',
      key === 'discardChanges' && 'text-red-600 focus:text-red-700',
      key === 'publish' && 'text-green-600 focus:text-green-700',
      key === 'requestReview' && 'text-amber-600 focus:text-amber-700',
      key === 'edit' && 'text-blue-600 focus:text-blue-700',
      key === 'managePermissions' && 'text-purple-600 focus:text-purple-700'
    )}
    {onclick}
  >
    <Icon class="h-4 w-4" />
    {label}
  </DropdownMenu.Item>
{/snippet}

{#if hasAnyActions}
  <div class="flex items-center gap-2">
    <!-- Desktop: Show all actions inline -->
    <div class="hidden items-center gap-1 lg:flex">
      {#if hasModuleActions}
        <div class="flex items-center gap-1">
          {#each moduleActions as action (action.key)}
            {@render buttonRow(action)}
          {/each}
        </div>
      {/if}

      <!-- Separator between regular and admin actions -->
      {#if hasModuleActions && hasAdminActions}
        <Separator.Root orientation="vertical" class="mx-1 h-6" />
      {/if}

      {#if hasAdminActions}
        <div class="flex items-center gap-1">
          {#each adminActions as action (action.key)}
            {@render buttonRow(action)}
          {/each}
        </div>
      {/if}
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
              class="h-7 w-7 border-gray-200 p-0 shadow-sm hover:border-gray-300 hover:bg-gray-50"
            >
              <span class="sr-only">Aktionen öffnen</span>
              <Ellipsis class="h-4 w-4" />
            </Button>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end" class="w-56">
          {#if hasModuleActions}
            <DropdownMenu.Group>
              <DropdownMenu.GroupHeading>Modul Aktionen</DropdownMenu.GroupHeading>
              {#each moduleActions as action (action.key)}
                {@render buttonMenuItem(action)}
              {/each}
            </DropdownMenu.Group>
          {/if}

          {#if hasModuleActions && hasAdminActions}
            <DropdownMenu.Separator />
          {/if}

          {#if hasAdminActions}
            <DropdownMenu.Group>
              <DropdownMenu.GroupHeading>Administration</DropdownMenu.GroupHeading>
              {#each adminActions as action (action.key)}
                {@render buttonMenuItem(action)}
              {/each}
            </DropdownMenu.Group>
          {/if}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  </div>
{:else}
  <!-- Show empty state or disabled button when no actions available -->
  <div class="text-sm italic text-muted-foreground">Keine</div>
{/if}
