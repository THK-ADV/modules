<script lang="ts">
  import * as Empty from '$lib/components/ui/empty/index.js'
  import { Table2 } from '@lucide/svelte'
</script>

<Empty.Root class="border-border/70 bg-background/80 min-h-[460px] border">
  <Empty.Header class="gap-3">
    <Empty.Media variant="icon" class="bg-muted text-primary size-14 rounded-2xl">
      <Table2 class="size-7" />
    </Empty.Media>
    <Empty.Title class="text-2xl font-semibold tracking-tight md:text-3xl">
      Tabellenansicht kommt bald
    </Empty.Title>
  </Empty.Header>
</Empty.Root>
