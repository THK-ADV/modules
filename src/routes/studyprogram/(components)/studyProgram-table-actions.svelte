<script lang="ts" module>
  const FEATURE_FLAG_CREATE_MODULE_CATALOG_PO = ['ing_een5', 'ing_gme5', 'ing_wiw5']

  function htmlPlaceholder(actionLabel: string, studyProgramLabel: string) {
    return `
      <html>
        <head><title>${actionLabel} wird generiert - ${studyProgramLabel}</title></head>
        <body style="font-family: system-ui; padding: 2rem; text-align: center; background: #f8fafc;">
          <div style="background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto;">
            <div style="width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top: 3px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1.5rem;"></div>
            <h1 style="color: #1f2937; margin-bottom: 1rem;">${actionLabel} wird generiert</h1>
            <p style="color: #6b7280; margin-bottom: 0.5rem;"><strong>${studyProgramLabel}</strong></p>
            <p style="color: #6b7280; margin-bottom: 1.5rem;">Geschätzte Dauer: <strong>~10 Sekunden</strong></p>
            <p style="color: #6b7280; font-size: 0.875rem;">Große Studiengänge benötigen mehr Zeit zur PDF-Generierung</p>
          </div>
          <style>
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </body>
      </html>
    `
  }

  function htmlError(actionLabel: string, errorMessage: string, isTimeoutError: boolean) {
    return `
          <html>
            <head><title>Fehler - ${actionLabel}</title></head>
            <body style="font-family: system-ui; padding: 2rem; text-align: center; background: #f8fafc;">
              <div style="background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; border-left: 4px solid #ef4444;">
                <h1 style="color: #1f2937; margin-bottom: 1rem;">Fehler beim Laden</h1>
                <p style="color: #6b7280; margin-bottom: 1.5rem; line-height: 1.6;">Fehlermeldung: ${errorMessage}</p>
                ${
                  isTimeoutError
                    ? `
                  <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 1rem; margin-bottom: 1.5rem; text-align: left;">
                    <p style="margin: 0; color: #92400e; font-size: 0.875rem; line-height: 1.5;">
                      <strong>Tipp bei Timeout-Fehlern:</strong><br/>
                      • Bei wiederholten Problemen kontaktieren Sie den Support
                    </p>
                  </div>
                `
                    : ''
                }
              </div>
            </body>
          </html>
        `
  }

  type PreviewActionKey = 'previewModuleCatalog' | 'previewExamList' | 'createModuleCatalog'
  type ActionKey = PreviewActionKey | 'releaseExamList'

  interface Action {
    key: ActionKey
    label: string
    Icon: Component<IconProps, object, ''>
    onclick: () => void
    variant: ButtonVariant
    className: string
    disabled?: boolean
  }
</script>

<script lang="ts">
  import Button, { type ButtonVariant } from '$lib/components/ui/button/button.svelte'
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index'
  import Spinner from '$lib/components/ui/spinner/spinner.svelte'
  import type { Role } from '$lib/types/role'
  import type { StudyProgram } from '$lib/types/study-program'
  import { cn } from '$lib/utils'
  import { Book, Ellipsis, Eye, FileCheck, type IconProps } from '@lucide/svelte'
  import type { Component } from 'svelte'

  let {
    studyProgram,
    roles,
    category,
    onClickRelease
  }: {
    studyProgram: StudyProgram
    roles: Role[]
    category: 'module-catalog' | 'exam-list'
    onClickRelease?: (sp: StudyProgram) => void
  } = $props()

  let currentPreviewAction: PreviewActionKey | undefined = $state(undefined)

  function isActionLoading(key: ActionKey): boolean {
    return currentPreviewAction === key
  }

  async function performPreviewAction(key: PreviewActionKey) {
    let action: string
    let actionLabel: string
    switch (key) {
      case 'previewModuleCatalog':
        action = 'moduleCatalog'
        actionLabel = 'Modulhandbuch'
        break
      case 'previewExamList':
        action = 'examList'
        actionLabel = 'Prüfungsliste'
        break
      case 'createModuleCatalog':
        // TODO: this is a temporary solution to preview the module catalog creation
        action = 'moduleCatalog_creation'
        actionLabel = 'Modulhandbuch'
        break
    }

    const newTab = window.open()
    const studyProgramLabel = studyProgram.deLabel

    newTab?.document.writeln(htmlPlaceholder(actionLabel, studyProgramLabel))
    newTab?.document.close()

    try {
      const po = studyProgram.po.id
      const sp = studyProgram.id
      const url = `/actions/preview/${action}?po=${encodeURIComponent(po)}&studyProgram=${encodeURIComponent(sp)}`

      // Use a longer timeout for large programs
      const timeoutDuration = 180000 // 3 min
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration)

      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }))
        throw new Error(error.message || `${action} failed`)
      }

      if (newTab && !newTab.closed) {
        const blob = await response.blob()
        const blobUrl = URL.createObjectURL(blob)
        newTab.location.assign(blobUrl)
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000)
      }
    } catch (error) {
      if (newTab && !newTab.closed) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Unbekannter Fehler beim Generieren des Dokuments'
        const isTimeoutError =
          errorMessage.includes('Server Timeout') || errorMessage.includes('aborted')

        newTab.document.writeln(htmlError(actionLabel, errorMessage, isTimeoutError))
        newTab.document.close()
      }
    } finally {
      setTimeout(() => {
        currentPreviewAction = undefined
      }, 1000)
    }
  }

  function previewAction(key: PreviewActionKey): Action {
    return {
      key,
      label: 'Vorschau',
      Icon: Eye,
      onclick: async () => {
        currentPreviewAction = key
        performPreviewAction(key)
      },
      variant: 'outline',
      className: 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-800',
      disabled: currentPreviewAction === key
    }
  }

  function releaseExamListAction(): Action {
    return {
      key: 'releaseExamList',
      label: 'Freigabe',
      Icon: FileCheck,
      onclick: () => {
        onClickRelease?.(studyProgram)
      },
      variant: 'outline',
      className: 'border-green-400 text-green-600 hover:bg-green-50 hover:text-green-700',
      disabled: false
    }
  }

  let actions: Action[] = $derived.by(() => {
    const actions = new Array<Action>()

    switch (category) {
      case 'module-catalog': {
        actions.push(previewAction('previewModuleCatalog'))

        // TODO: this is a temporary solution to preview the module catalog creation
        const key = 'createModuleCatalog'
        if (FEATURE_FLAG_CREATE_MODULE_CATALOG_PO.includes(studyProgram.po.id)) {
          actions.push({
            key,
            label: 'Erstellen',
            Icon: Book,
            onclick: async () => {
              currentPreviewAction = key
              performPreviewAction(key)
            },
            variant: 'outline',
            className: 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-800',
            disabled: currentPreviewAction === key
          })
        }
        break
      }
      case 'exam-list':
        actions.push(previewAction('previewExamList'))
        if (roles.some(({ id }) => id === 'pav')) {
          actions.push(releaseExamListAction())
        }
        break
    }
    return actions
  })
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
      <Icon class="h-4 w-4" />
    {/if}
    {label}
  </Button>
{/snippet}

{#snippet buttonMenuItem({ key, onclick, label, Icon, disabled }: Action)}
  <DropdownMenu.Item
    class={cn(
      'flex cursor-pointer items-center gap-2 font-medium',
      key === 'previewModuleCatalog' && 'text-gray-600 focus:text-gray-700',
      key === 'previewExamList' && 'text-gray-600 focus:text-gray-700',
      key === 'releaseExamList' && 'text-green-600 focus:text-green-700',
      disabled && 'pointer-events-none cursor-not-allowed opacity-50'
    )}
    {onclick}
    {disabled}
  >
    {#if isActionLoading(key)}
      <Spinner size="sm" />
    {:else}
      <Icon class="h-4 w-4" />
    {/if}
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
          class="h-7 w-7 border-gray-200 p-0 shadow-sm hover:border-gray-300 hover:bg-gray-50"
        >
          <span class="sr-only">Aktionen öffnen</span>
          <Ellipsis class="h-4 w-4" />
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
