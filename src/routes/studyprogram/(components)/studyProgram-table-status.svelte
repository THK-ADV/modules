<script lang="ts">
  import { Badge } from '$lib/components/ui/badge'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import { CircleCheckIcon, LoaderCircleIcon } from '@lucide/svelte'

  let {
    badgeContent,
    tooltipBadge,
    tooltipPending
  }: {
    badgeContent: string | undefined
    tooltipBadge?: () => string
    tooltipPending?: () => string
  } = $props()
</script>

{#if badgeContent}
  <Badge variant="outline" class="gap-1.5 text-muted-foreground">
    <CircleCheckIcon
      class="h-4 w-4 fill-green-600 stroke-white dark:fill-green-400 dark:stroke-white"
    />
    {#if tooltipBadge}
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger>
            <span class="hidden lg:inline">{badgeContent}</span>
          </Tooltip.Trigger>
          <Tooltip.Content>
            <div class="max-w-sm">{tooltipBadge()}</div>
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>
    {:else}
      <span class="hidden lg:inline">{badgeContent}</span>
    {/if}
  </Badge>
{:else}
  <Badge variant="outline" class="gap-1.5 text-muted-foreground">
    <LoaderCircleIcon class="h-3.5 w-3.5 stroke-muted-foreground" />
    {#if tooltipPending}
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger>
            <span class="hidden lg:inline">Ausstehend</span>
          </Tooltip.Trigger>
          <Tooltip.Content>
            <div class="max-w-sm">{tooltipPending()}</div>
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>
    {:else}
      <span class="hidden lg:inline">Ausstehend</span>
    {/if}
  </Badge>
{/if}
