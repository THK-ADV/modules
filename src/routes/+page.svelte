<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte'
  import * as Card from '$lib/components/ui/card/index.js'
  import { routesMap } from '$lib/routes.svelte'
  import {
    Book,
    Calendar1,
    FileText,
    Github,
    Mail,
    Pencil,
    Search,
    ArrowRight
  } from '@lucide/svelte'
  import { resolve } from '$app/paths'
  const defaultRoutes = routesMap.defaultRoutes

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const currentDay = now.getDate()
  const currentMonthLabel = new Intl.DateTimeFormat('de-DE', {
    month: 'long',
    year: 'numeric'
  }).format(now)
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstWeekdayOffset = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7
  const monthDays = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1)
  const trailingDaysCount = (7 - ((firstWeekdayOffset + daysInCurrentMonth) % 7)) % 7
  const leadingDays = Array.from({ length: firstWeekdayOffset }, (_, i) => i)
  const trailingDays = Array.from({ length: trailingDaysCount }, (_, i) => i)
</script>

<div class="from-background via-background to-muted/20 flex h-full flex-1 flex-col bg-linear-to-b">
  <!-- Hero -->
  <section
    class="mx-auto grid max-w-7xl gap-10 px-4 pt-10 pb-14 md:grid-cols-2 md:items-center md:gap-12"
  >
    <div class="space-y-6">
      <div class="space-y-3">
        <p class="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
          TH Köln · Campus Gummersbach
        </p>
        <h1 class="text-4xl leading-tight font-bold tracking-tight md:text-5xl lg:text-6xl">
          Modulverwaltung<br />Fakultät 10
        </h1>
      </div>
      <p class="text-muted-foreground max-w-xl text-lg leading-relaxed">
        Zentrale Plattform für Modulbeschreibungen, Modulhandbücher und Prüfungslisten aller
        Studiengänge der Fakultät für Informatik und Ingenieurwissenschaften.
      </p>
      <div class="flex flex-wrap gap-3 pt-2">
        <Button size="lg" href={resolve('/modules')}>
          Module durchsuchen
          <ArrowRight class="ml-2 size-4" />
        </Button>
        <Button variant="outline" size="lg" href={resolve('/schedule')}>
          <Calendar1 class="mr-2 size-4" />
          Kalender öffnen
        </Button>
      </div>
    </div>

    <div class="bg-card/80 rounded-xl border p-8 shadow-sm backdrop-blur-sm">
      <div class="space-y-4">
        <h3 class="text-xl font-semibold">Schnellzugriff</h3>
        <div class="space-y-2">
          <a
            href={resolve('/modules')}
            class="hover:bg-accent/70 group flex items-center justify-between rounded-md px-3 py-2.5 transition-colors"
          >
            <div class="flex items-center gap-3">
              <Search class="text-muted-foreground size-5" />
              <span class="font-medium">{defaultRoutes['/modules'].name}</span>
            </div>
            <ArrowRight
              class="text-muted-foreground size-4 opacity-0 transition-opacity group-hover:opacity-100"
            />
          </a>
          <a
            href={resolve('/module-catalogs')}
            class="hover:bg-accent/70 group flex items-center justify-between rounded-md px-3 py-2.5 transition-colors"
          >
            <div class="flex items-center gap-3">
              <Book class="text-muted-foreground size-5" />
              <span class="font-medium">{defaultRoutes['/module-catalogs'].name}</span>
            </div>
            <ArrowRight
              class="text-muted-foreground size-4 opacity-0 transition-opacity group-hover:opacity-100"
            />
          </a>
          <a
            href={resolve('/exam-lists')}
            class="hover:bg-accent/70 group flex items-center justify-between rounded-md px-3 py-2.5 transition-colors"
          >
            <div class="flex items-center gap-3">
              <FileText class="text-muted-foreground size-5" />
              <span class="font-medium">Prüfungslisten</span>
            </div>
            <ArrowRight
              class="text-muted-foreground size-4 opacity-0 transition-opacity group-hover:opacity-100"
            />
          </a>
          <a
            href={resolve('/my-modules')}
            class="hover:bg-accent/70 group flex items-center justify-between rounded-md px-3 py-2.5 transition-colors"
          >
            <div class="flex items-center gap-3">
              <Pencil class="text-muted-foreground size-5" />
              <span class="font-medium">Meine Module</span>
            </div>
            <ArrowRight
              class="text-muted-foreground size-4 opacity-0 transition-opacity group-hover:opacity-100"
            />
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- Calendar Feature Highlight -->
  <section class="border-y py-16">
    <div class="mx-auto grid max-w-7xl gap-12 px-4 md:grid-cols-5">
      <div class="space-y-4 md:col-span-2">
        <div
          class="bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium"
        >
          <Calendar1 class="size-4" />
          Neu
        </div>
        <h2 class="text-3xl font-bold tracking-tight">Semesterkalender</h2>
        <p class="text-muted-foreground leading-relaxed">
          Behalten Sie den Überblick über Ihr Studium mit unserem integrierten Kalender. Alle
          wichtigen Termine an einem Ort: Ihr persönlicher Stundenplan, Prüfungstermine,
          vorlesungsfreie Zeit und Feiertage.
        </p>
        <div class="space-y-3 pt-2">
          <div class="flex items-start gap-3">
            <div class="bg-primary/10 mt-0.5 rounded-full p-1">
              <div class="bg-primary size-2 rounded-full"></div>
            </div>
            <div>
              <p class="font-medium">Stundenplan</p>
              <p class="text-muted-foreground text-sm">
                Vorlesungen, Übungen und Praktika nach Studiengang
              </p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="bg-primary/10 mt-0.5 rounded-full p-1">
              <div class="bg-primary size-2 rounded-full"></div>
            </div>
            <div>
              <p class="font-medium">Semesterplan</p>
              <p class="text-muted-foreground text-sm">Vorlesungszeit und vorlesungsfreie Zeit</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="bg-primary/10 mt-0.5 rounded-full p-1">
              <div class="bg-primary size-2 rounded-full"></div>
            </div>
            <div>
              <p class="font-medium">Feiertage</p>
              <p class="text-muted-foreground text-sm">Gesetzliche Feiertage in NRW</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="bg-primary/10 mt-0.5 rounded-full p-1">
              <div class="size-2 rounded-full"></div>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <p class="font-medium">Prüfungsplan</p>
                <span
                  class="bg-muted text-muted-foreground rounded-full border px-2 py-0.5 text-[11px] font-medium"
                >
                  Demnächst
                </span>
              </div>
              <p class="text-muted-foreground text-sm">In Vorbereitung und bald verfügbar</p>
            </div>
          </div>
        </div>
        <div class="pt-4">
          <Button href={resolve('/schedule')}>
            Zum Kalender
            <ArrowRight class="ml-2 size-4" />
          </Button>
        </div>
      </div>

      <div
        class="bg-card/70 flex items-center justify-center rounded-xl border p-8 shadow-sm md:col-span-3"
      >
        <div class="w-full space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground text-sm font-medium">{currentMonthLabel}</span>
            <div class="flex gap-2">
              <div class="bg-muted size-8 rounded"></div>
              <div class="bg-muted size-8 rounded"></div>
            </div>
          </div>
          <div class="grid grid-cols-7 gap-1 text-center text-xs font-medium">
            {#each ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as day (day)}
              <div class="text-muted-foreground py-2">{day}</div>
            {/each}
          </div>
          <div class="grid grid-cols-7 gap-1">
            {#each leadingDays as i (i)}
              <div class="bg-muted/40 aspect-square rounded border border-transparent"></div>
            {/each}

            {#each monthDays as day (day)}
              <div
                class={`bg-card hover:bg-accent/70 relative aspect-square rounded border text-sm transition-colors ${day === currentDay ? 'border-primary/60' : ''}`}
              >
                <span class="absolute top-1 left-1 text-xs font-medium">{day}</span>
                {#if day === currentDay}
                  <div class="absolute top-5 left-1">
                    <div class="bg-primary h-0.5 w-4 rounded-full"></div>
                  </div>
                {/if}
              </div>
            {/each}

            {#each trailingDays as i (i)}
              <div class="bg-muted/40 aspect-square rounded border border-transparent"></div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Features -->
  <section class="py-16">
    <div class="mx-auto max-w-7xl space-y-12 px-4">
      <div class="max-w-2xl">
        <h2 class="mb-3 text-3xl font-bold tracking-tight">Was diese Plattform bietet</h2>
        <p class="text-muted-foreground">
          Alle Werkzeuge für effektive Modulverwaltung und Studienplanung
        </p>
      </div>

      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <a href={resolve('/modules')} class="group block" aria-label="Zur Modulesuche">
          <Card.Root
            class="hover:border-primary/60 hover:bg-card group-focus-visible:ring-ring h-full border transition-all duration-200 group-hover:-translate-y-0.5 group-focus-visible:ring-2"
          >
            <Card.Header>
              <div class="mb-3 flex items-center justify-between">
                <Search class="text-muted-foreground size-6" />
                <ArrowRight
                  class="text-muted-foreground size-4 opacity-60 transition-transform group-hover:translate-x-0.5"
                />
              </div>
              <Card.Title>{defaultRoutes['/modules'].name}</Card.Title>
            </Card.Header>
            <Card.Content>
              <p class="text-muted-foreground text-sm leading-relaxed">
                Durchsuchen Sie alle veröffentlichten Modulbeschreibungen mit umfangreichen Filter-
                und Sortiermöglichkeiten.
              </p>
            </Card.Content>
          </Card.Root>
        </a>

        <a href={resolve('/module-catalogs')} class="group block" aria-label="Zu Modulhandbüchern">
          <Card.Root
            class="hover:border-primary/60 hover:bg-card group-focus-visible:ring-ring h-full border transition-all duration-200 group-hover:-translate-y-0.5 group-focus-visible:ring-2"
          >
            <Card.Header>
              <div class="mb-3 flex items-center justify-between">
                <Book class="text-muted-foreground size-6" />
                <ArrowRight
                  class="text-muted-foreground size-4 opacity-60 transition-transform group-hover:translate-x-0.5"
                />
              </div>
              <Card.Title>{defaultRoutes['/module-catalogs'].name}</Card.Title>
            </Card.Header>
            <Card.Content>
              <p class="text-muted-foreground text-sm leading-relaxed">
                Laden Sie aktuelle Modulhandbücher aller Studiengänge als PDF herunter.
              </p>
            </Card.Content>
          </Card.Root>
        </a>

        <a href={resolve('/exam-lists')} class="group block" aria-label="Zu Prüfungslisten">
          <Card.Root
            class="hover:border-primary/60 hover:bg-card group-focus-visible:ring-ring h-full border transition-all duration-200 group-hover:-translate-y-0.5 group-focus-visible:ring-2"
          >
            <Card.Header>
              <div class="mb-3 flex items-center justify-between">
                <FileText class="text-muted-foreground size-6" />
                <ArrowRight
                  class="text-muted-foreground size-4 opacity-60 transition-transform group-hover:translate-x-0.5"
                />
              </div>
              <Card.Title>Prüfungslisten</Card.Title>
            </Card.Header>
            <Card.Content>
              <p class="text-muted-foreground text-sm leading-relaxed">
                Aktuelle Prüfungslisten aller Studiengänge mit Details zu Prüfungsformen, Phasen und
                Prüfern.
              </p>
            </Card.Content>
          </Card.Root>
        </a>

        <a href={resolve('/my-modules')} class="group block" aria-label="Zu Meine Module">
          <Card.Root
            class="hover:border-primary/60 hover:bg-card group-focus-visible:ring-ring h-full border transition-all duration-200 group-hover:-translate-y-0.5 group-focus-visible:ring-2"
          >
            <Card.Header>
              <div class="mb-3 flex items-center justify-between">
                <Pencil class="text-muted-foreground size-6" />
                <ArrowRight
                  class="text-muted-foreground size-4 opacity-60 transition-transform group-hover:translate-x-0.5"
                />
              </div>
              <Card.Title>Module bearbeiten</Card.Title>
            </Card.Header>
            <Card.Content>
              <p class="text-muted-foreground text-sm leading-relaxed">
                Modulverantwortliche können ihre Module direkt online bearbeiten und Änderungen zur
                Freigabe einreichen.
              </p>
            </Card.Content>
          </Card.Root>
        </a>
      </div>
    </div>
  </section>

  <!-- Target Audience -->
  <section class="bg-muted/20 border-y py-16">
    <div class="mx-auto max-w-7xl px-4">
      <div class="mb-12 max-w-2xl">
        <h2 class="mb-3 text-3xl font-bold tracking-tight">Für wen ist diese Plattform?</h2>
        <p class="text-muted-foreground">Unterschiedliche Zielgruppen, ein gemeinsames System</p>
      </div>
      <div class="grid gap-8 md:grid-cols-3">
        <div class="bg-card/60 rounded-xl border p-6 shadow-sm">
          <h3 class="mb-3 text-xl font-semibold">Studierende</h3>
          <p class="text-muted-foreground text-sm leading-relaxed">
            Jederzeit Zugriff auf alle relevanten Modulinformationen: Von Modulverantwortlichen bis
            zum Arbeitsaufwand. Planen Sie Ihr Studium fundiert und gestalten Sie Ihren
            Studienverlauf optimal.
          </p>
        </div>
        <div class="bg-card/60 rounded-xl border p-6 shadow-sm">
          <h3 class="mb-3 text-xl font-semibold">Lehrende</h3>
          <p class="text-muted-foreground text-sm leading-relaxed">
            Pflegen und aktualisieren Sie Ihre Modulbeschreibungen eigenverantwortlich. Stellen Sie
            sicher, dass Studierende stets aktuelle Informationen erhalten – bei reduziertem
            administrativen Aufwand.
          </p>
        </div>
        <div class="bg-card/60 rounded-xl border p-6 shadow-sm">
          <h3 class="mb-3 text-xl font-semibold">Verwaltung</h3>
          <p class="text-muted-foreground text-sm leading-relaxed">
            Umfassende Übersicht über alle angebotenen Module der Fakultät. Identifizieren Sie
            Pflicht- und Wahlmodule des aktuellen Semesters und optimieren Sie die
            Ressourcenplanung.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- Contact -->
  <section class="border-t py-16">
    <div class="mx-auto max-w-7xl px-4">
      <div class="grid gap-12 md:grid-cols-2">
        <div class="space-y-6">
          <div>
            <h2 class="mb-3 text-3xl font-bold tracking-tight">Kontakt & Support</h2>
            <p class="text-muted-foreground">
              Bei technischen Fragen oder Problemen stehen wir Ihnen zur Verfügung
            </p>
          </div>
          <div class="space-y-4">
            <div class="flex items-start gap-3">
              <Mail class="text-muted-foreground mt-1 size-5" />
              <div>
                <p class="mb-1 font-medium">E-Mail Support</p>
                <a
                  href="mailto:schedule-dev@gm.fh-koeln.de"
                  class="text-primary text-sm hover:underline"
                >
                  schedule-dev@gm.fh-koeln.de
                </a>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Github class="text-muted-foreground mt-1 size-5" />
              <div>
                <p class="mb-1 font-medium">Open Source</p>
                <a
                  href="https://github.com/THK-ADV/modules"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary text-sm hover:underline"
                >
                  GitHub Repository
                </a>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-card/70 rounded-xl border p-6 shadow-sm">
          <h3 class="mb-4 font-semibold">Weitere Informationen</h3>
          <div class="space-y-2 text-sm">
            <a
              href="https://www.th-koeln.de/hochschule/impressum_8159.php"
              target="_blank"
              rel="noopener noreferrer"
              class="text-muted-foreground hover:text-foreground flex items-center justify-between rounded-md px-2 py-1.5 transition-colors hover:bg-white/50 dark:hover:bg-black/20"
            >
              Impressum
              <ArrowRight class="size-3" />
            </a>
            <a
              href="https://www.th-koeln.de/hochschule/haftungshinweis_8277.php"
              target="_blank"
              rel="noopener noreferrer"
              class="text-muted-foreground hover:text-foreground flex items-center justify-between rounded-md px-2 py-1.5 transition-colors hover:bg-white/50 dark:hover:bg-black/20"
            >
              Haftungshinweis
              <ArrowRight class="size-3" />
            </a>
            <a
              href="https://www.th-koeln.de/hochschule/datenschutzhinweis_8279.php"
              target="_blank"
              rel="noopener noreferrer"
              class="text-muted-foreground hover:text-foreground flex items-center justify-between rounded-md px-2 py-1.5 transition-colors hover:bg-white/50 dark:hover:bg-black/20"
            >
              Datenschutzhinweise
              <ArrowRight class="size-3" />
            </a>
            <a
              href={resolve('/help')}
              class="text-muted-foreground hover:text-foreground flex items-center justify-between rounded-md px-2 py-1.5 transition-colors hover:bg-white/50 dark:hover:bg-black/20"
            >
              Hilfe und Dokumentation
              <ArrowRight class="size-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <footer class="bg-muted/20 mt-auto border-t py-6">
    <div class="mx-auto max-w-7xl px-4">
      <p class="text-muted-foreground text-center text-sm">
        © {currentYear} TH Köln · Campus Gummersbach · Fakultät für Informatik und Ingenieurwissenschaften
      </p>
    </div>
  </footer>
</div>
