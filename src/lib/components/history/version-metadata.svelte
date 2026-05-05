<script lang="ts">
  import { isParsed, type ModuleVersion } from '$lib/types/module-version'

  type Props = { version: ModuleVersion }

  let { version }: Props = $props()

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const title = $derived(
    isParsed(version)
      ? version.content.module.title
      : version.content.type === 'deleted'
        ? 'Modul gelöscht'
        : 'Parsing fehlgeschlagen'
  )

  const semesterLabel = $derived(`${version.semester.deLabel} ${version.semester.year}`)
</script>

<div class="flex min-w-0 flex-1 flex-col gap-1.5">
  <h3 class="text-foreground m-0 line-clamp-2 text-sm leading-snug font-semibold" {title}>
    {title}
  </h3>
  <p class="text-muted-foreground m-0 flex flex-wrap items-baseline gap-x-2 text-xs tabular-nums">
    <span>{formatDate(version.committedAt)}</span>
    <span aria-hidden="true">·</span>
    <span>{semesterLabel}</span>
    <span aria-hidden="true">·</span>
    <span class="font-mono">{version.commitId.slice(0, 7)}</span>
  </p>
</div>
