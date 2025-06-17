<script lang="ts">
  import Spinner from '../spinner/spinner.svelte'

  let {
    show = false,
    message,
    zIndex = 50
  }: {
    show?: boolean
    message: string
    zIndex?: number
  } = $props()
</script>

{#if show}
  <div
    class="fixed inset-0 flex items-center justify-center bg-background/20 backdrop-blur-[1px]"
    style="z-index: {zIndex}"
  >
    <div class="flex items-center space-x-3 rounded-lg border bg-card p-4 shadow-lg">
      <Spinner size="lg" class="text-primary" />
      <span class="text-sm font-medium">{message}</span>
    </div>
  </div>
{/if}
