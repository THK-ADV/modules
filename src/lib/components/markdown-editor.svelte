<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'
  import * as Form from '$lib/components/ui/form/index.js'
  import { Textarea } from '$lib/components/ui/textarea/index.js'
  import type { ModificationStatus } from '$lib/types/module-draft-keys'
  import { getFieldHighlightClasses } from '$lib/types/module-draft-keys'
  import { Bold, Eye, Italic, Link, List, ListOrdered, Pencil } from '@lucide/svelte'
  import { marked } from 'marked'
  import ModificationIndicator from './modification-indicator.svelte'

  interface Props {
    form: any
    name: string
    label: string
    description?: string
    placeholder?: string
    value: string
    errors?: any
    modificationStatus?: ModificationStatus // optional modification tracking
  }

  let {
    form,
    name,
    label,
    description,
    placeholder = 'Markdown-Text eingeben…',
    value = $bindable(),
    errors = {},
    modificationStatus
  }: Props = $props()

  let showPreview = $state(false)
  let textareaElement: HTMLTextAreaElement | null = $state(null)

  // calculate rows based on content
  const minRows = 15
  const maxRows = 25
  const defaultRows = 5
  let calculatedRows = $derived.by(() => {
    if (!value) return defaultRows

    const lineCount = value.split('\n').length
    const contentRows = Math.max(lineCount + 1, minRows) // +1 for extra space
    return Math.min(contentRows, maxRows)
  })

  // markdown toolbar functions

  function renderedMarkdown() {
    return value
      ? marked.parse(value)
      : '<p class="text-muted-foreground italic">Keine Vorschau verfügbar</p>'
  }

  function insertMarkdown(before: string, after: string = '', placeholder: string = '') {
    if (!textareaElement) return

    const start = textareaElement.selectionStart
    const end = textareaElement.selectionEnd
    const selectedText = value.substring(start, end)
    const replacement = selectedText || placeholder
    const newText = value.substring(0, start) + before + replacement + after + value.substring(end)

    value = newText

    // Set focus and cursor position
    setTimeout(() => {
      if (textareaElement) {
        textareaElement.focus()
        const newCursorPosition = start + before.length + replacement.length
        textareaElement.setSelectionRange(newCursorPosition, newCursorPosition)
      }
    }, 0)
  }

  function makeBold() {
    insertMarkdown('**', '**', 'fetter Text')
  }

  function makeItalic() {
    insertMarkdown('*', '*', 'kursiver Text')
  }

  function insertBulletList() {
    if (!textareaElement) return

    const start = textareaElement.selectionStart
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const needsNewline = lineStart > 0 && value.substring(lineStart, start).trim() !== ''

    insertMarkdown(needsNewline ? '\n- ' : '- ', '', 'Listenelement')
  }

  function insertNumberedList() {
    if (!textareaElement) return

    const start = textareaElement.selectionStart
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const needsNewline = lineStart > 0 && value.substring(lineStart, start).trim() !== ''

    insertMarkdown(needsNewline ? '\n1. ' : '1. ', '', 'Listenelement')
  }

  function insertLink() {
    insertMarkdown('[', '](https://example.com)', 'Link-Text')
  }
</script>

{#if modificationStatus}
  <!-- Enhanced version with modification tracking -->
  <div class="space-y-3 {getFieldHighlightClasses(modificationStatus)}">
    <Form.Field {form} {name}>
      <Form.Control>
        {#snippet children({ props })}
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-foreground">{label}</span>
                <ModificationIndicator status={modificationStatus} iconOnly={false} inline={true} />
              </div>
              <div class="flex items-center gap-2">
                {#if !showPreview}
                  <!-- Toolbar -->
                  <div class="flex items-center gap-1 rounded-md border p-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onclick={makeBold}
                      class="h-7 w-7 p-0"
                      title="Fett"
                    >
                      <Bold class="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onclick={makeItalic}
                      class="h-7 w-7 p-0"
                      title="Kursiv"
                    >
                      <Italic class="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onclick={insertBulletList}
                      class="h-7 w-7 p-0"
                      title="Aufzählungsliste"
                    >
                      <List class="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onclick={insertNumberedList}
                      class="h-7 w-7 p-0"
                      title="Nummerierte Liste"
                    >
                      <ListOrdered class="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onclick={insertLink}
                      class="h-7 w-7 p-0"
                      title="Link"
                    >
                      <Link class="h-3 w-3" />
                    </Button>
                  </div>
                {/if}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onclick={() => (showPreview = !showPreview)}
                  class="h-9 px-2"
                >
                  {#if showPreview}
                    <Pencil class="mr-1 h-3 w-3" />
                    Bearbeiten
                  {:else}
                    <Eye class="mr-1 h-3 w-3" />
                    Vorschau
                  {/if}
                </Button>
              </div>
            </div>

            <div class="space-y-2">
              {#if showPreview}
                <div
                  class="min-h-[{calculatedRows *
                    1.5}rem] prose prose-sm max-w-none rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                  {@html renderedMarkdown()}
                </div>
              {:else}
                <Textarea
                  {...props}
                  bind:ref={textareaElement}
                  bind:value
                  {placeholder}
                  rows={calculatedRows}
                  class={`resize-y font-mono text-sm ${errors[name] ? 'border-destructive' : ''}`}
                />
              {/if}
            </div>
          </div>
        {/snippet}
      </Form.Control>
      {#if description}
        <Form.Description>{description}</Form.Description>
      {/if}
      <Form.FieldErrors />
    </Form.Field>
  </div>
{:else}
  <!-- Standard version without modification tracking -->
  <Form.Field {form} {name}>
    <Form.Control>
      {#snippet children({ props })}
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <Form.Label>{label}</Form.Label>
            <div class="flex items-center gap-2">
              {#if !showPreview}
                <!-- Toolbar -->
                <div class="flex items-center gap-1 rounded-md border p-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onclick={makeBold}
                    class="h-7 w-7 p-0"
                    title="Fett"
                  >
                    <Bold class="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onclick={makeItalic}
                    class="h-7 w-7 p-0"
                    title="Kursiv"
                  >
                    <Italic class="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onclick={insertBulletList}
                    class="h-7 w-7 p-0"
                    title="Aufzählungsliste"
                  >
                    <List class="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onclick={insertNumberedList}
                    class="h-7 w-7 p-0"
                    title="Nummerierte Liste"
                  >
                    <ListOrdered class="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onclick={insertLink}
                    class="h-7 w-7 p-0"
                    title="Link"
                  >
                    <Link class="h-3 w-3" />
                  </Button>
                </div>
              {/if}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onclick={() => (showPreview = !showPreview)}
                class="h-9 px-2"
              >
                {#if showPreview}
                  <Pencil class="mr-1 h-3 w-3" />
                  Bearbeiten
                {:else}
                  <Eye class="mr-1 h-3 w-3" />
                  Vorschau
                {/if}
              </Button>
            </div>
          </div>

          <div class="space-y-2">
            {#if showPreview}
              <div
                class="min-h-[{calculatedRows *
                  1.5}rem] prose prose-sm max-w-none rounded-md border bg-background px-3 py-2 text-sm"
              >
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html renderedMarkdown()}
              </div>
            {:else}
              <Textarea
                {...props}
                bind:ref={textareaElement}
                bind:value
                {placeholder}
                rows={calculatedRows}
                class={`resize-y font-mono text-sm ${errors[name] ? 'border-destructive' : ''}`}
              />
            {/if}
          </div>
        </div>
      {/snippet}
    </Form.Control>
    {#if description}
      <Form.Description>{description}</Form.Description>
    {/if}
    <Form.FieldErrors />
  </Form.Field>
{/if}
