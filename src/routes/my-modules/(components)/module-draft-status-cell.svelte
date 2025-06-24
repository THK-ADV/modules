<script lang="ts">
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import type { ModuleDraftState } from '$lib/types/module-draft'
  import { CheckCircle, CheckSquare, Clock, Eye, HelpCircle, Loader, XCircle } from '@lucide/svelte'

  let { state }: { state: ModuleDraftState } = $props()

  const Icon = $derived.by(() => {
    switch (state) {
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
    switch (state) {
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

  let label = $derived.by(() => {
    switch (state) {
      case 'published':
        return 'Aktuellste Version'
      case 'valid_for_publication':
        return 'Bereit zur Übernahme'
      case 'waiting_for_changes':
        return 'Anpassungen notwendig'
      case 'waiting_for_publication':
        return 'Warte auf Backend'
      case 'valid_for_review':
        return 'Bereit zum Review'
      case 'waiting_for_review':
        return 'Warte auf Review'
      case 'unknown':
        return 'Unbekannt'
    }
  })
</script>

<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger>
      <div class="flex min-w-0 items-center">
        <!-- The flex-shrink-0 will prevent the icon from shrinking if space is limited -->
        <Icon
          class="mr-2 h-4 w-4 flex-shrink-0 {state === 'waiting_for_changes'
            ? 'text-amber-500'
            : 'text-muted-foreground'}"
        />
        <span class="truncate text-sm font-medium">{label}</span>
      </div>
    </Tooltip.Trigger>
    <!-- long tooltips will wrap properly by word breaking if needed -->
    <Tooltip.Content class="max-w-xs break-words">{tooltip}</Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
