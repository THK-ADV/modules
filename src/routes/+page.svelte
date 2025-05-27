<script lang="ts">
  import Button from '$lib/components/ui/button/button.svelte'
  import * as Card from '$lib/components/ui/card/index.js'
  import { routesMap } from '$lib/routes.svelte'
  import { Book, FileText, Github, Mail, Pencil, Search } from '@lucide/svelte'

  const defaultRoutes = routesMap.defaultRoutes
</script>

<div class="flex h-full flex-1 flex-col">
  <section class="flex flex-col items-center justify-center pb-12 text-center">
    <div class="max-w-4xl space-y-6">
      <h1 class="text-4xl font-bold tracking-tight sm:text-6xl">Modulverwaltung</h1>
      <p class="text-xl text-muted-foreground sm:text-2xl">TH Köln Campus Gummersbach</p>
      <p class="mx-auto max-w-2xl text-lg text-muted-foreground">
        Zentrale Anwendung für die Verwaltung von Modulbeschreibungen, Modulhandbüchern und
        Prüfungslisten aller Studiengänge der Fakultät 10.
      </p>
      <div class="flex flex-col gap-4 sm:flex-row sm:justify-center">
        <Button size="lg" class="text-base" href="/modules">
          <Search class="mr-2 h-5 w-5" />
          Module durchsuchen
        </Button>
        <Button variant="outline" size="lg" class="text-base" href="/module-catalogs">
          <Book class="mr-2 h-5 w-5" />
          {defaultRoutes['/module-catalogs'].name}
        </Button>
      </div>
    </div>
  </section>

  <section class="py-12">
    <div class="mx-auto max-w-6xl px-4">
      <div class="mb-8 text-center">
        <h2 class="mb-4 text-3xl font-bold">Funktionen der Anwendung</h2>
        <p class="text-lg text-muted-foreground">
          Alles was Sie für die Modulverwaltung benötigen, an einem Ort
        </p>
      </div>

      <div class="grid gap-6 md:grid-cols-2 md:items-stretch xl:grid-cols-4">
        <Card.Root
          class="group flex flex-col border-l-4 border-l-blue-500 transition-all duration-300 hover:shadow-lg"
        >
          <Card.Header class="pb-2">
            <div
              class="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 transition-colors group-hover:bg-blue-200"
            >
              <Search class="h-6 w-6" />
            </div>
            <Card.Title class="text-xl">{defaultRoutes['/modules'].name}</Card.Title>
          </Card.Header>
          <Card.Content class="flex flex-1 flex-col">
            <p class="mb-4 flex-1 leading-relaxed text-muted-foreground">
              Durchsuchen Sie alle veröffentlichten Modulbeschreibungen der Fakultät 10 mit
              umfangreichen Filter- und Sortiermöglichkeiten.
            </p>
            <Button
              variant="outline"
              size="sm"
              href="/modules"
              class="w-full group-hover:bg-blue-50"
            >
              Zur {defaultRoutes['/modules'].name}
            </Button>
          </Card.Content>
        </Card.Root>

        <Card.Root
          class="group flex flex-col border-l-4 border-l-green-500 transition-all duration-300 hover:shadow-lg"
        >
          <Card.Header class="pb-2">
            <div
              class="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600 transition-colors group-hover:bg-green-200"
            >
              <Book class="h-6 w-6" />
            </div>
            <Card.Title class="text-xl">{defaultRoutes['/module-catalogs'].name}</Card.Title>
          </Card.Header>
          <Card.Content class="flex flex-1 flex-col">
            <p class="mb-4 flex-1 leading-relaxed text-muted-foreground">
              Laden Sie aktuelle Modulhandbücher aller Studiengänge als PDF herunter. Immer auf dem
              neuesten Stand.
            </p>
            <Button
              variant="outline"
              size="sm"
              href="/module-catalogs"
              class="w-full group-hover:bg-green-50"
            >
              Zu den {defaultRoutes['/module-catalogs'].name}
            </Button>
          </Card.Content>
        </Card.Root>

        <Card.Root
          class="group flex flex-col border-l-4 border-l-purple-500 transition-all duration-300 hover:shadow-lg"
        >
          <Card.Header class="pb-2">
            <div
              class="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600 transition-colors group-hover:bg-purple-200"
            >
              <FileText class="h-6 w-6" />
            </div>
            <Card.Title class="text-xl">Prüfungslisten</Card.Title>
          </Card.Header>
          <Card.Content class="flex flex-1 flex-col">
            <p class="mb-4 flex-1 leading-relaxed text-muted-foreground">
              Aktuelle Prüfungslisten aller Studiengänge mit Details zu Prüfungsformen, Phasen sowie
              Prüfern.
            </p>
            <Button
              variant="outline"
              size="sm"
              href="/examination"
              class="w-full group-hover:bg-purple-50"
            >
              Zu den Prüfungslisten
            </Button>
          </Card.Content>
        </Card.Root>

        <Card.Root
          class="group flex flex-col border-l-4 border-l-orange-500 transition-all duration-300 hover:shadow-lg"
        >
          <Card.Header class="pb-2">
            <div
              class="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 text-orange-600 transition-colors group-hover:bg-orange-200"
            >
              <Pencil class="h-6 w-6" />
            </div>
            <Card.Title class="text-xl">Module bearbeiten</Card.Title>
          </Card.Header>
          <Card.Content class="flex flex-1 flex-col">
            <p class="mb-4 flex-1 leading-relaxed text-muted-foreground">
              Modulverantwortliche können ihre Module direkt online bearbeiten und Änderungen zur
              Freigabe einreichen.
            </p>
            <Button
              variant="outline"
              size="sm"
              href="/my-modules"
              class="w-full group-hover:bg-orange-50"
            >
              Zu meinen Modulen
            </Button>
          </Card.Content>
        </Card.Root>
      </div>
    </div>
  </section>

  <section class="bg-muted/30 py-12">
    <div class="mx-auto max-w-4xl px-4 text-center">
      <h2 class="mb-6 text-3xl font-bold">Für wen ist diese Anwendung?</h2>
      <div class="grid gap-8 md:grid-cols-3">
        <div class="space-y-2">
          <h3 class="text-xl font-semibold">Studierende</h3>
          <p class="leading-relaxed text-muted-foreground">
            Finden Sie detaillierte Informationen zu allen Modulen Ihres Studiengangs und laden Sie
            aktuelle Modulhandbücher herunter.
          </p>
        </div>
        <div class="space-y-2">
          <h3 class="text-xl font-semibold">Lehrende</h3>
          <p class="leading-relaxed text-muted-foreground">
            Bearbeiten Sie Ihre Modulbeschreibungen direkt online und halten Sie alle Informationen
            aktuell.
          </p>
        </div>
        <div class="space-y-2">
          <h3 class="text-xl font-semibold">Verwaltung</h3>
          <p class="leading-relaxed text-muted-foreground">
            Zentrale Verwaltung aller Modulinformationen mit Genehmigungs- und
            Veröffentlichungsworkflows.
          </p>
        </div>
      </div>
    </div>
  </section>

  <section class="py-12">
    <div class="mx-auto max-w-4xl px-4">
      <div class="mb-8 text-center">
        <h2 class="mb-4 text-3xl font-bold">Kontakt & Informationen</h2>
        <p class="text-lg text-muted-foreground">
          Bei Fragen oder Problemen stehen wir Ihnen gerne zur Verfügung
        </p>
      </div>

      <div class="grid gap-6 md:grid-cols-2">
        <Card.Root class="text-center">
          <Card.Header class="pb-2">
            <div
              class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600"
            >
              <Mail class="h-6 w-6" />
            </div>
            <Card.Title>Kontakt</Card.Title>
          </Card.Header>
          <Card.Content>
            <p class="mb-4 text-muted-foreground">Für technische Fragen und Support</p>
            <a
              href="mailto:schedule-dev@gm.fh-koeln.de"
              class="inline-flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Mail class="mr-2 h-4 w-4" />
              schedule-dev@gm.fh-koeln.de
            </a>
          </Card.Content>
        </Card.Root>

        <Card.Root class="text-center">
          <Card.Header class="pb-2">
            <div
              class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-700"
            >
              <Github class="h-6 w-6" />
            </div>
            <Card.Title>Open Source</Card.Title>
          </Card.Header>
          <Card.Content>
            <p class="mb-4 text-muted-foreground">Entwickelt mit ❤️ und vollständig Open Source</p>
            <a
              href="https://github.com/THK-ADV/modules"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Github class="mr-2 h-4 w-4" />
              GitHub Repository
            </a>
          </Card.Content>
        </Card.Root>
      </div>
    </div>
  </section>

  <footer class="mt-auto border-t bg-muted/20 py-8">
    <div class="mx-auto max-w-4xl px-4 text-center">
      <p class="mb-4 text-muted-foreground">
        © 2025 TH Köln - Campus Gummersbach | Fakultät für Informatik und Ingenieurwissenschaften
      </p>
      <div class="flex justify-center gap-6 text-sm">
        <a
          href="https://www.th-koeln.de/hochschule/impressum_8159.php"
          target="_blank"
          rel="noopener noreferrer"
          class="text-muted-foreground transition-colors hover:text-foreground"
        >
          Impressum
        </a>
        <a href="/privacy" class="text-muted-foreground transition-colors hover:text-foreground">
          Datenschutzerklärung
        </a>
      </div>
    </div>
  </footer>
</div>
