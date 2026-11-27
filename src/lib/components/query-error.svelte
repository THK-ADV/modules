<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'
  import { getErrorMessage } from '$lib/errors'

  type Props = {
    title: string
    error: unknown
    reset: () => void
    query: { refresh(): Promise<unknown> }
  }
  const { title, error, reset, query }: Props = $props()
</script>

<div class="space-y-4 rounded-xl border p-6" role="alert">
  <div class="space-y-1">
    <h2 class="font-semibold">{title}</h2>
    <p class="text-muted-foreground text-sm">{getErrorMessage(error)}</p>
  </div>
  <Button
    variant="outline"
    onclick={() => {
      /** The remounted content awaits this query and lets the boundary display any new error. */
      void query.refresh().catch(() => {})
      reset()
    }}>Erneut versuchen</Button
  >
</div>
