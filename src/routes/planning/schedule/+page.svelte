<script lang="ts">
  import QueryError from '$lib/components/query-error.svelte'
  import type { Snippet } from 'svelte'
  import type { PageProps } from './$types'
  import PlanDrafts from './(components)/plan-drafts.svelte'
  import { getSchedulePlanDrafts } from './planning.remote'

  const { data }: PageProps = $props()
  const canEdit = $derived(data.userInfo?.hasSchedulePlanningPrivileges ?? false)
</script>

{#snippet header(actions?: Snippet)}
  <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div class="min-w-0 space-y-2">
      <h2 class="text-3xl font-bold tracking-tight">Stundenplanung</h2>
      <p class="text-muted-foreground text-sm">
        {#if canEdit}
          Planungen verwalten, eine neue Planung beginnen oder die Live-Daten bearbeiten.
        {:else}
          Bestehende Planungen einsehen.
        {/if}
      </p>
    </div>
    {@render actions?.()}
  </div>
{/snippet}

<svelte:boundary>
  <PlanDrafts {canEdit} {header} />
  {#snippet failed(error, reset)}
    <div class="flex h-full flex-1 flex-col space-y-8">
      {@render header()}
      <QueryError
        title="Planungen nicht verfügbar"
        {error}
        {reset}
        query={getSchedulePlanDrafts()}
      />
    </div>
  {/snippet}
</svelte:boundary>
