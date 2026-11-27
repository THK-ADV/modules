<script lang="ts">
  import PublishedDocumentTable from '$lib/components/published-document-table.svelte'
  import { navigating } from '$app/state'
  import { getPublishedDocuments } from '../studyprogram/studyprogram.remote'

  const documents = getPublishedDocuments('moduleCatalogs')
  // on client navigation, documents still cached from an earlier visit may be stale or failed;
  // on hydration they are fresh from server rendering
  if (navigating.type && !documents.loading) void documents.refresh()
</script>

<div class="flex h-full flex-1 flex-col space-y-8">
  <div class="space-y-2">
    <h2 class="text-3xl font-bold tracking-tight">Modulhandbücher</h2>
    <p class="text-muted-foreground text-sm">
      Freigegebene Modulhandbücher aller Studiengänge der TH Köln am Campus Gummersbach.
    </p>
  </div>
  <PublishedDocumentTable data={await documents} fileBasePath="/api/moduleCatalogs/file/" />
</div>
