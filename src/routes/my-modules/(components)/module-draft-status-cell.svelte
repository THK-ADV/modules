<script lang="ts">
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import type { ModuleDraftState } from '$lib/types/module-draft'
  import { CheckCircle, CheckSquare, Clock, Eye, HelpCircle, Loader, XCircle } from '@lucide/svelte'

  let {
    id,
    deLabel
  }: {
    id: ModuleDraftState
    deLabel: string
  } = $props()

  const Icon = $derived.by(() => {
    switch (id) {
      case 'published':
        return CheckCircle
      case 'valid_for_review':
        return Eye
      case 'valid_for_publication':
        return CheckSquare
      case 'waiting_for_changes':
        return XCircle
      case 'waiting_for_review':
        return Clock
      case 'waiting_for_publication':
        return Loader
      case 'unknown':
        return HelpCircle
    }
  })

  const tooltip = $derived.by(() => {
    switch (id) {
      case 'published':
        return 'Die aktuelle Version des Moduls wird in der nächsten Ausgabe des Modulhandbuchs und in der Modulsuche aufgeführt.'
      case 'valid_for_review':
        return 'Das Modul kann zur Genehmigung freigegeben werden. Eine Genehmigung ist erforderlich, da genehmigungspflichtige Attribute geändert wurden.'
      case 'valid_for_publication':
        return 'Die Moduländerungen können final übernommen werden. Nach der Bearbeitungsphase werden die Änderungen im Modulhandbuch und in der Modulsuche aufgeführt.'
      case 'waiting_for_changes':
        return 'Das Modul wurde im Genehmigungsprozess abgelehnt und benötigt Anpassungen. Konkrete Hinweise sehen Sie, wenn Sie das Modul bearbeiten.'
      case 'waiting_for_review':
        return 'Das Modul ist im Genehmigungsprozess. Der Prüfungsauschluss oder die Studiengangsleitung prüft die Änderungen.'
      case 'waiting_for_publication':
        return 'Die Moduländerungen werden im Backend verarbeitet. Dies kann einige Minuten dauern.'
      case 'unknown':
        return 'Unbekannt'
    }
  })

  // override a few labels for better UX
  let label = $derived.by(() => {
    switch (id) {
      case 'published':
        return 'Aktuellste Version'
      case 'valid_for_publication':
        return 'Bereit zur Übernahme'
      case 'waiting_for_changes':
        return 'Anpassungen notwendig'
      case 'waiting_for_publication':
        return 'Warte auf Backend'
      default:
        return deLabel
    }
  })
</script>

<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger>
      <div class="flex min-w-0 items-center">
        <!-- The flex-shrink-0 will prevent the icon from shrinking if space is limited -->
        <Icon
          class="mr-2 h-4 w-4 flex-shrink-0 {id === 'waiting_for_changes'
            ? 'text-amber-500'
            : 'text-muted-foreground'}"
        />
        <!-- TODO: add ECTS info to distinguish modules with the same name -->
        <span class="truncate text-sm font-medium">{label}</span>
      </div>
    </Tooltip.Trigger>
    <!-- long tooltips will wrap properly by word breaking if needed -->
    <Tooltip.Content class="max-w-xs break-words">{tooltip}</Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
