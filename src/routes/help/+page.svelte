<script lang="ts">
  import { resolve } from '$app/paths'
  import { page } from '$app/state'
  import { FileText, Settings } from '@lucide/svelte'
  import type { PageProps } from './$types'

  const { data }: PageProps = $props()

  const moduleReviewKeys = $derived(
    data.moduleReviewKeys
      .map((key) => key.label)
      .toSorted((a, b) => a.localeCompare(b))
      .join(', ')
  )

  const navigationSections = [
    {
      id: 'system-workflows',
      title: 'Systemabläufe',
      icon: Settings,
      subsections: [
        { id: 'semester-cycle', title: 'Bearbeitungsphase' },
        { id: 'review-process', title: 'Prüfprozess' }
      ]
    },
    {
      id: 'module-attributes',
      title: 'Modulattribute',
      icon: FileText,
      subsections: [
        { id: 'module-types', title: 'Modulart' },
        { id: 'assessment-methods', title: 'Prüfungsformen' },
        { id: 'attendance-requirement', title: 'Anwesenheitspflicht' },
        { id: 'assessment-prerequisite', title: 'Prüfungsvoraussetzung' }
      ]
    }
  ]

  let activeSection = $state('')
  let activeSubsection = $state('')

  $effect(() => {
    const hash = page.url.hash
    if (hash) {
      scrollToSection(hash.slice(1))
    }
  })

  function scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId)
    if (element) {
      history.pushState(null, '', `#${sectionId}`)

      // Update active states immediately for instant feedback
      if (
        navigationSections.some((section) =>
          section.subsections?.some((sub) => sub.id === sectionId)
        )
      ) {
        activeSubsection = sectionId
        activeSection =
          navigationSections.find((section) =>
            section.subsections?.some((sub) => sub.id === sectionId)
          )?.id || activeSection
      } else {
        activeSection = sectionId
        activeSubsection = ''
      }

      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
</script>

{#snippet TLDR(content: string)}
  <div class="border-l-muted-foreground/30 bg-muted/50 rounded border-l-2 py-2 pr-2 pl-3 italic">
    <div class="text-muted-foreground text-sm">
      <span class="text-foreground font-medium">TLDR:</span>
      <span class="text-muted-foreground">{content}</span>
    </div>
  </div>
{/snippet}

<div class="w-full max-w-none space-y-8">
  <div class="flex gap-8">
    <!-- Main Content -->
    <main class="min-w-0 flex-1 space-y-12">
      <!-- Page Header -->
      <div class="space-y-2">
        <h2 class="text-3xl font-bold tracking-tight">Hilfe und Dokumentation</h2>
        <p class="text-muted-foreground text-sm wrap-break-word">
          Auf dieser Seite werden die wichtigsten Systemabläufe der Modulverwaltung erklärt. Zudem
          finden Sie hier eine detaillierte Beschreibung der wichtigsten Modulattribute.
        </p>
      </div>

      <!-- System Workflows Section -->
      <section id="system-workflows" class="space-y-8">
        <div class="space-y-2">
          <h2 class="text-2xl font-bold tracking-tight">Systemabläufe</h2>
          <p>
            Die Modulverwaltung besteht im wesentlichen aus zwei wichtigen Abläufen: Der
            Bearbeitungsphase und dem Prüfprozess.
          </p>
        </div>

        <!-- Semester Cycle -->
        <div id="semester-cycle" class="space-y-4">
          <h3 class="text-xl font-semibold">Bearbeitungsphase</h3>

          {@render TLDR(
            'Module können nur während der Bearbeitungsphase geändert werden • Startet im aktuellen Semester, endet vor Semesterstart • Änderungen sind für andere erst am Ende sichtbar'
          )}

          <div class="space-y-2">
            <p>
              Module können nur während der Bearbeitungsphase geändert werden. Die Bearbeitungsphase
              für das kommende Semester startet bereits im aktuellen Semester und endet ein paar
              Wochen vor dem nächsten Semesterstart. Auf diese Weise werden aktuelle
              Modulbeschreibungen, Prüfungslisten und Modulhandbücher garantiert.
            </p>
            <p>
              Die während der Bearbeitungsphase geänderten Module sind <strong>nicht</strong> für andere
              Personen oder Studierende über die Modulsuche sichtbar. Diese werden erst am Ende der Bearbeitungsphase
              veröffentlicht.
            </p>
          </div>
        </div>

        <!-- Review Process -->
        <div id="review-process" class="space-y-4">
          <h3 class="text-xl font-semibold">Prüfprozess</h3>

          {@render TLDR(
            'Bestimmte Modulattribute lösen einen Prüfprozess aus • PAVs/SGLs müssen alle zustimmen • Bei Ablehnung: Anpassungen vornehmen und erneut prüfen lassen'
          )}

          <div class="space-y-2">
            <p>
              Bestimmte Modulattribute lösen bei Änderungen einen Prüfprozess aus. Während der
              Prüfung werden die Änderungen entweder akzeptiert oder mit Änderungswünschen
              zurückgesendet.
              {#if moduleReviewKeys}
                <span>Diese Attribute sind: <strong>{moduleReviewKeys}</strong></span>
              {/if}
            </p>
            <p>
              Die Prüfung erfolgt durch die PAVs oder SGLs der zugeordneten Studiengänge. Es müssen <strong
                >alle</strong
              > zustimmen, damit die Änderungen wirksam werden. Sobald eine Person ablehnt, muss der /
              die MV Anpassungen vornehmen und die Prüfung erneut anfordern. Der Prüfprozess wiederholt
              sich.
            </p>
          </div>
        </div>
      </section>

      <!-- Module Attributes Section -->

      <section id="module-attributes" class="space-y-8">
        <div class="space-y-2">
          <h2 class="text-2xl font-bold tracking-tight">Modulattribute</h2>
          <p>
            Im Folgenden werden die wichtigsten Modulattribute erklärt. Zudem wird darauf
            eingegangen, wo die Attribute verwendet werden (z.B. Modulbeschreibung, Modulhandbuch,
            Prüfungslisten, etc.).
          </p>
        </div>

        <div id="module-types" class="space-y-4">
          <h3 class="text-xl font-semibold">Modulart</h3>
          <div class="space-y-2">
            <p>TODO</p>
          </div>
        </div>

        <div id="assessment-methods" class="space-y-4">
          <h3 class="text-xl font-semibold">Prüfungsformen</h3>
          <div class="space-y-2">
            <p>
              Die zulässigen Prüfungsformen sind in der Prüfungsordnung definiert. Für eine schnelle
              Übersicht <a
                href={resolve('/assessment-methods')}
                class="text-primary underline hover:no-underline"
              >
                gibt es eine eigene Seite.
              </a>
            </p>
          </div>
        </div>

        <div id="attendance-requirement" class="space-y-4">
          <h3 class="text-xl font-semibold">Anwesenheitspflicht</h3>
          <div class="space-y-2">
            <p>TODO</p>
          </div>
        </div>

        <div id="assessment-prerequisite" class="space-y-4">
          <h3 class="text-xl font-semibold">Prüfungsvoraussetzung</h3>
          <div class="space-y-2">
            <p>TODO</p>
          </div>
        </div>
      </section>
    </main>

    <!-- Navigation Sidebar -->
    <aside class="sticky top-6 hidden w-64 shrink-0 self-start lg:block">
      <div class="bg-card max-h-[calc(100vh-4rem)] overflow-y-auto rounded-lg border p-4 shadow-sm">
        <nav class="space-y-1">
          <div class="border-border mb-6 border-b pb-3">
            <h3 class="text-foreground text-lg font-semibold">Inhaltsverzeichnis</h3>
          </div>

          {#each navigationSections as section (section.id)}
            <div class="space-y-1">
              <button
                class="hover:bg-muted relative flex w-full items-center rounded-md px-3 py-2 text-left text-sm font-medium transition-all duration-200 {activeSection ===
                section.id
                  ? 'bg-primary/15 text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'}"
                onclick={() => scrollToSection(section.id)}
              >
                <div class="flex items-center space-x-2">
                  {#if section.icon}
                    {@const Icon = section.icon}
                    <Icon class="size-4" />
                  {/if}
                  <span>{section.title}</span>
                </div>
              </button>

              {#if section.subsections}
                <div class="border-border ml-4 space-y-1 border-l pl-4">
                  {#each section.subsections as subsection (subsection.id)}
                    <button
                      class="hover:bg-muted relative block w-full rounded-md px-3 py-1.5 text-left text-xs transition-all duration-200 {activeSubsection ===
                      subsection.id
                        ? 'bg-primary/10 text-primary scale-[1.02] font-medium shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'}"
                      onclick={() => scrollToSection(subsection.id)}
                    >
                      {subsection.title}
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </nav>
      </div>
    </aside>
  </div>
</div>
