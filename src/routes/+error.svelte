<script lang="ts">
  import { page } from '$app/state'

  // throw Error() is used for unexpected errors. Its error message is always 'Internal Error', since it does not expose sensitive informations to the users
  const isUnexpectedError = page.error?.message === 'Internal Error'
  const title = isUnexpectedError
    ? `${page.status} - Ein unerwarteter Fehler ist aufgetreten`
    : `${page.status} - Ein Fehler ist aufgetreten`
  const message = isUnexpectedError ? undefined : page.error?.message
</script>

<div class="space-y-2">
  <h1 class="text-2xl font-bold tracking-tight">{title}</h1>
  {#if message}
    <p>Fehlernachricht: {message}</p>
  {/if}
  <div class="h-px w-full bg-border"></div>
  <pre
    class="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-sm text-muted-foreground">{JSON.stringify(
      page,
      null,
      2
    )}</pre>
</div>
