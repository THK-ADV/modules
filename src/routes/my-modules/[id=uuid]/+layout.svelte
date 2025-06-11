<script lang="ts">
  import { browser } from '$app/environment'
  import { beforeNavigate } from '$app/navigation'
  import { page } from '$app/state'
  import Button from '$lib/components/ui/button/button.svelte'
  import Separator from '$lib/components/ui/separator/separator.svelte'
  import { routesMap } from '$lib/routes.svelte'
  import { moduleSchema } from '$lib/schemas/module'
  import { cn } from '$lib/utils'
  import SuperDebug, { superForm } from 'sveltekit-superforms'
  import { zodClient } from 'sveltekit-superforms/adapters'
  import type { LayoutProps } from './$types'
  import { setModuleFormContext } from './context'

  let { children, data }: LayoutProps = $props()

  routesMap.selectedModule = { id: data.module.id, title: data.module.metadata.title }

  const id = page.params.id

  const sections = [
    {
      id: 'general',
      label: 'Allgemeine Informationen',
      href: `/my-modules/${id}/general`
    },
    {
      id: 'management',
      label: 'Verantwortliche',
      href: `/my-modules/${id}/management`
    },
    {
      id: 'examination',
      label: 'Prüfungsleistungen',
      href: `/my-modules/${id}/examination`
    },
    {
      id: 'workload',
      label: 'Workload',
      href: `/my-modules/${id}/workload`
    },
    {
      id: 'study-programs',
      label: 'Zuordnung zu Studiengängen',
      href: `/my-modules/${id}/study-programs`
    },
    {
      id: 'learning-outcomes',
      label: 'Learning Outcomes',
      href: `/my-modules/${id}/learning-outcomes`
    },
    {
      id: 'module-content',
      label: 'Modulinhalte',
      href: `/my-modules/${id}/module-content`
    },
    {
      id: 'teaching-methods',
      label: 'Lehr- und Lernmethoden',
      href: `/my-modules/${id}/teaching-methods`
    },
    {
      id: 'literature',
      label: 'Empfohlene Literatur',
      href: `/my-modules/${id}/literature`
    },
    {
      id: 'particularities',
      label: 'Besonderheiten',
      href: `/my-modules/${id}/particularities`
    },
    {
      id: 'prerequisites',
      label: 'Voraussetzungen',
      href: `/my-modules/${id}/prerequisites`
    },
    {
      id: 'misc',
      label: 'Sonstige Informationen',
      href: `/my-modules/${id}/misc`
    }
  ]

  const form = superForm(data.form, {
    validators: zodClient(moduleSchema),
    dataType: 'json',
    onUpdated: ({ form: f }) => {
      if (f.valid) {
        console.log('Module updated successfully!')
      }
    },
    onError: ({ result }) => {
      console.log('Failed to update module', result)
    }
  })

  setModuleFormContext(form)

  const { form: formData, enhance, tainted } = form

  // TODO: debug only
  let showDebug = $state(false)

  const hasUnsavedChanges = $derived($tainted)

  // Get current section for dropdown
  const currentSection = $derived(
    sections.find((section) => page.url.pathname === section.href) || sections[0]
  )

  // Handle dropdown navigation
  function handleSectionChange(event: Event) {
    const target = event.target as HTMLSelectElement
    const selectedHref = target.value
    if (selectedHref && browser) {
      window.location.href = selectedHref
    }
  }

  $effect(() => {
    if (!browser) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  })

  beforeNavigate(({ to, cancel }) => {
    if (hasUnsavedChanges && to) {
      const currentModuleBase = `/my-modules/${id}`
      const isWithinModule = to.url.pathname.startsWith(currentModuleBase)

      if (!isWithinModule) {
        if (
          !confirm('Sie haben ungespeicherte Änderungen. Möchten Sie die Seite wirklich verlassen?')
        ) {
          cancel()
        }
      }
    }
  })
</script>

<div class="space-y-8">
  <!-- Header -->
  <div class="space-y-2">
    <h1 class="text-2xl font-bold tracking-tight">Modul bearbeiten</h1>
    <p class="text-muted-foreground">
      Bearbeiten Sie die Modulinformationen und speichern Sie Ihre Änderungen.
    </p>
  </div>

  <Separator />

  {#if browser}
    <div class="space-y-2">
      <Button variant="outline" size="sm" onclick={() => (showDebug = !showDebug)} class="text-xs">
        {showDebug ? 'Hide' : 'Show'} Debug Info
      </Button>
      {#if showDebug}
        <div class="rounded-md border p-4">
          <SuperDebug data={$formData} />
        </div>
      {/if}
    </div>
  {/if}

  <form method="POST" action="/my-modules/{id}" use:enhance>
    <!-- Mobile Section Selector (shown on small screens) -->
    <div class="lg:hidden">
      <label for="section-select" class="mb-2 block text-sm font-medium text-foreground">
        Abschnitt auswählen:
      </label>
      <select
        id="section-select"
        class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        value={currentSection.href}
        onchange={handleSectionChange}
      >
        {#each sections as section (section.id)}
          <option value={section.href}>{section.label}</option>
        {/each}
      </select>
    </div>

    <!-- Desktop Layout -->
    <div class="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
      <!-- Sidebar Navigation (hidden on small screens) -->
      <aside class="hidden lg:block lg:w-1/5">
        <nav class="flex flex-col space-y-1">
          {#each sections as section (section.id)}
            <a
              href={section.href}
              class={cn(
                'block h-auto justify-start rounded-md px-3 py-2 font-normal transition-colors',
                page.url.pathname === section.href
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              {section.label}
            </a>
          {/each}
        </nav>
        <Button class="mt-12 w-full" type="submit">Modul aktualisieren</Button>
      </aside>

      <!-- Main Content -->
      <div class="flex-1 lg:max-w-2xl">
        <div class="space-y-4">
          {@render children?.()}
        </div>
      </div>
    </div>

    <!-- Mobile Submit Button -->
    <Button class="mt-12 w-full lg:hidden" type="submit">Modul aktualisieren</Button>
  </form>
</div>
