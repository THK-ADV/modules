<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation'
  import { page } from '$app/state'
  import Button, { type ButtonVariant } from '$lib/components/ui/button/button.svelte'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index'
  import LoadingOverlay from '$lib/components/ui/loading-overlay/loading-overlay.svelte'
  import Spinner from '$lib/components/ui/spinner/spinner.svelte'
  import {
    canCancelReview,
    canDiscardChanges,
    canEdit,
    canPublish,
    canRequestReview,
    type ModuleDraftState
  } from '$lib/types/module-draft'
  import { cn } from '$lib/utils'
  import { SquarePen, Ellipsis, Eye, Trash2, Upload, X, Zap, type IconProps } from '@lucide/svelte'
  import type { Component } from 'svelte'
  import type { ModuleDraftTableAction } from '../../actions/module-actions/[moduleId]/+server'

  type ActionKey = ModuleDraftTableAction | 'edit'

  interface Props {
    moduleId: string
    moduleDraftState: ModuleDraftState
    canBeFastForwardApproved: boolean
  }

  interface Action {
    key: ActionKey
    label: string
    Icon: Component<IconProps, object, ''>
    onclick: () => void
    variant: ButtonVariant
    className: string
    disabled?: boolean
  }

  let { moduleId, moduleDraftState, canBeFastForwardApproved }: Props = $props()

  let isDeleting = $state(false)
  let isPublishing = $state(false)
  let isRequestingReview = $state(false)
  let isCancelingReview = $state(false)

  let isPerformingAction = $derived(
    isDeleting || isPublishing || isRequestingReview || isCancelingReview
  )

  let loadingOverlayMessage = $derived.by(() => {
    if (isDeleting) {
      return 'Änderungen werden verworfen...'
    } else if (isPublishing) {
      return 'Änderungen werden übernommen...'
    } else if (isRequestingReview && canBeFastForwardApproved) {
      return 'Review wird übersprungen...'
    } else if (isRequestingReview) {
      return 'Review wird angefragt...'
    } else if (isCancelingReview) {
      return 'Review wird zurückgezogen...'
    } else {
      return ''
    }
  })

  function isActionLoading(key: ActionKey): boolean {
    return (
      (key === 'publish' && isPublishing) ||
      (key === 'requestReview' && isRequestingReview) ||
      (key === 'cancelReview' && isCancelingReview) ||
      (key === 'delete' && isDeleting)
    )
  }

  async function performAction(action: ModuleDraftTableAction) {
    try {
      const response = await fetch(`/actions/module-actions/${moduleId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || `${action} failed`)
      }

      // refresh the page data
      await invalidateAll()
    } catch (error) {
      console.error(`${action} failed:`, error)
      alert(`Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    } finally {
      // reset loading states
      switch (action) {
        case 'delete':
          isDeleting = false
          break
        case 'publish':
          isPublishing = false
          break
        case 'requestReview':
        case 'requestFastForwardReview':
          isRequestingReview = false
          break
        case 'cancelReview':
          isCancelingReview = false
          break
      }
    }
  }

  let moduleActions = $derived.by(() => {
    const actions = new Array<Action>()
    const state = moduleDraftState

    if (canEdit(state)) {
      actions.push({
        key: 'edit',
        label: 'Bearbeiten',
        Icon: SquarePen,
        onclick: () => goto(`${page.url.pathname}/${moduleId}`),
        variant: 'outline',
        className: 'border-blue-400 text-blue-600 hover:bg-blue-50 hover:text-blue-700',
        disabled: isPerformingAction
      })
    }

    if (canPublish(state)) {
      actions.push({
        key: 'publish',
        label: 'Änderungen übernehmen',
        Icon: Upload,
        onclick: async () => {
          if (!isPublishing) {
            isPublishing = true
            await performAction('publish')
          }
        },
        variant: 'outline',
        className: 'border-green-400 text-green-600 hover:bg-green-50 hover:text-green-700',
        disabled: isPerformingAction
      })
    }

    if (canRequestReview(state)) {
      actions.push({
        key: 'requestReview',
        label: 'Review anfragen',
        Icon: Eye,
        onclick: async () => {
          if (!isRequestingReview) {
            isRequestingReview = true
            await performAction('requestReview')
          }
        },
        variant: 'outline',
        className: 'border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800',
        disabled: isPerformingAction
      })

      if (canBeFastForwardApproved) {
        actions.push({
          key: 'requestFastForwardReview',
          label: 'Review überspringen',
          Icon: Zap,
          onclick: async () => {
            if (!isRequestingReview) {
              isRequestingReview = true
              await performAction('requestFastForwardReview')
            }
          },
          variant: 'outline',
          className: 'border-purple-400 text-purple-700 hover:bg-purple-50 hover:text-purple-800',
          disabled: isPerformingAction
        })
      }
    }

    if (canCancelReview(state)) {
      actions.push({
        key: 'cancelReview',
        label: 'Review zurückziehen',
        Icon: X,
        onclick: async () => {
          if (!isCancelingReview) {
            isCancelingReview = true
            await performAction('cancelReview')
          }
        },
        variant: 'outline',
        className: 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-800',
        disabled: isPerformingAction
      })
    }

    if (canDiscardChanges(state)) {
      actions.push({
        key: 'delete',
        label: 'Änderungen verwerfen',
        Icon: Trash2,
        onclick: async () => {
          if (
            !isDeleting &&
            confirm(
              'Sind Sie sicher, dass Sie die Änderungen verwerfen möchten? Diese Aktion kann nicht rückgängig gemacht werden.'
            )
          ) {
            isDeleting = true
            await performAction('delete')
          }
        },
        variant: 'outline',
        className: 'border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800',
        disabled: isPerformingAction
      })
    }

    return actions
  })

  let hasActions = $derived(moduleActions.length > 0)
</script>

{#snippet buttonRow({ className, variant, onclick, label, Icon, disabled, key }: Action)}
  <Button
    {variant}
    size="sm"
    class={cn(
      'font-medium shadow-sm transition-colors',
      className,
      disabled && 'pointer-events-none cursor-not-allowed opacity-50'
    )}
    {onclick}
    {disabled}
  >
    {#if isActionLoading(key)}
      <Spinner size="sm" />
    {:else}
      <Icon class="size-4" />
    {/if}
    {label}
  </Button>
{/snippet}

{#snippet buttonMenuItem({ key, onclick, label, Icon, disabled }: Action)}
  <DropdownMenu.Item
    class={cn(
      'flex cursor-pointer items-center gap-2 font-medium',
      key === 'delete' && 'text-red-600 focus:text-red-700',
      key === 'publish' && 'text-green-600 focus:text-green-700',
      key === 'requestReview' && 'text-amber-600 focus:text-amber-700',
      key === 'requestFastForwardReview' && 'text-purple-600 focus:text-purple-700',
      key === 'edit' && 'text-blue-600 focus:text-blue-700',
      disabled && 'pointer-events-none cursor-not-allowed opacity-50'
    )}
    {onclick}
    {disabled}
  >
    {#if isActionLoading(key)}
      <Spinner size="sm" />
    {:else}
      <Icon class="size-4" />
    {/if}
    {label}
  </DropdownMenu.Item>
{/snippet}

<!-- loading overlay -->
<LoadingOverlay show={isPerformingAction} message={loadingOverlayMessage} />

{#if hasActions}
  <div
    class="flex items-center gap-2"
    class:pointer-events-none={isPerformingAction}
    class:opacity-75={isPerformingAction}
  >
    <!-- Desktop: Show all actions inline -->
    <div class="hidden items-center gap-1 lg:flex">
      <div class="flex items-center gap-1">
        {#each moduleActions as action (action.key)}
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
              disabled={isPerformingAction}
            >
              <span class="sr-only">Aktionen öffnen</span>
              <Ellipsis class="size-4" />
            </Button>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end" class="w-56">
          <DropdownMenu.Group>
            <DropdownMenu.GroupHeading>Modul Aktionen</DropdownMenu.GroupHeading>
            {#each moduleActions as action (action.key)}
              {@render buttonMenuItem(action)}
            {/each}
          </DropdownMenu.Group>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  </div>
{:else}
  <!-- Show empty state or disabled button when no actions available -->
  <div class="text-muted-foreground text-sm italic">Keine</div>
{/if}
