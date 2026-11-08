<script lang="ts">
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import * as Dialog from '$lib/components/ui/dialog/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { examMergeSchema, type Exam, type ExamModule } from '$lib/schemas/exams'
  import { getErrorMessage } from '$lib/errors'
  import { cn } from '$lib/utils'
  import { LoaderCircle, Merge } from '@lucide/svelte'
  import { plural, stateBadge } from '../(components)/exam-planning'
  import { mergeExams } from './exams.remote'

  let {
    open = $bindable(false),
    exams,
    onMerged
  }: {
    open: boolean
    /** Exams to merge, at least two; the dialog is recreated for each selection. */
    exams: Exam[]
    onMerged: (target: Exam) => void
  } = $props()

  // svelte-ignore state_referenced_locally
  let name = $state(exams[0]?.name ?? '')
  let error = $state<string>()
  let merging = $state(false)

  const trimmed = $derived(name.trim())
  /** The exam whose name is taken keeps its id; a custom name goes to the first one. */
  const named = $derived(exams.find((e) => e.name === trimmed))
  const target = $derived(named ?? exams[0])
  /** One exam per distinct name. */
  const names = $derived([...new Map(exams.map((e) => [e.name, e])).values()])
  const modules = $derived(
    [...new Map(exams.flatMap((e) => e.modules.map((m) => [m.id, m]))).values()].toSorted((a, b) =>
      a.title.localeCompare(b.title, 'de')
    )
  )

  async function merge() {
    if (merging || !target) return
    const parsed = examMergeSchema.safeParse({
      target: target.id,
      sources: exams.filter((e) => e !== target).map((e) => e.id),
      name
    })
    if (!parsed.success) return (error = parsed.error.issues[0].message)
    merging = true
    error = undefined
    try {
      await mergeExams(parsed.data)
      open = false
      onMerged(target)
    } catch (e) {
      error = getErrorMessage(e)
    } finally {
      merging = false
    }
  }
</script>

{#snippet inactive(m: ExamModule)}
  {#if m.status !== 'active'}
    <Badge variant="outline" class={cn('font-normal', stateBadge.warning)}>Inaktiv</Badge>
  {/if}
{/snippet}

<Dialog.Root bind:open>
  <Dialog.Content class="flex max-h-[90dvh] flex-col gap-0 p-0 sm:max-w-2xl">
    <Dialog.Header class="border-b py-4 pr-12 pl-6">
      <Dialog.Title>{plural(exams.length, 'Prüfung', 'Prüfungen')} zusammenführen</Dialog.Title>
      <Dialog.Description>
        Alle Module werden in einer gemeinsamen Prüfung gebündelt. Prüfungslisten, Auswahlen und
        Termine verweisen danach auf sie; die übrigen Prüfungen werden gelöscht.
      </Dialog.Description>
    </Dialog.Header>
    <div class="space-y-4 overflow-y-auto px-6 py-6">
      <!-- The merged exam is the only object; the former names are suggestions. -->
      <section class="rounded-xl border" aria-labelledby="merge-result">
        <div class="bg-muted/25 space-y-4 rounded-t-xl border-b p-4">
          <label id="merge-result" for="merge-name" class="block text-sm font-medium">
            Name der gemeinsamen Prüfung
          </label>
          <Input id="merge-name" class="bg-background h-10 font-semibold" bind:value={name} />
          {#if names.length > 1}
            <div class="flex flex-wrap gap-2" role="group" aria-label="Name übernehmen">
              {#each names as exam (exam.id)}
                <Button
                  variant="outline"
                  size="sm"
                  aria-pressed={exam === named}
                  class="aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground h-7 max-w-full rounded-full font-normal"
                  onclick={() => (name = exam.name)}
                >
                  <span class="truncate">{exam.name}</span>
                </Button>
              {/each}
            </div>
          {/if}
        </div>
        <h3 id="merge-modules" class="px-4 pt-4 text-sm font-medium">
          Für {plural(modules.length, 'Modul', 'Module')}
        </h3>
        <ul class="divide-y" aria-labelledby="merge-modules">
          {#each modules as m (m.id)}
            <li class="flex items-baseline gap-3 p-4 text-sm">
              <span class="text-muted-foreground w-14 shrink-0 truncate font-mono text-xs">
                {m.abbrev}
              </span>
              <span class="min-w-0 flex-1 wrap-anywhere">
                {m.title}
                {@render inactive(m)}
                <span class="text-muted-foreground block text-xs sm:hidden">
                  {m.firstExaminer.label}
                </span>
              </span>
              <span class="text-muted-foreground hidden w-28 shrink-0 truncate sm:block">
                {m.firstExaminer.label}
              </span>
              <span class="text-muted-foreground text-xs whitespace-nowrap tabular-nums">
                {m.ects.toLocaleString('de')} ECTS
              </span>
            </li>
          {:else}
            <li class="text-muted-foreground p-4 text-sm">Keine Module</li>
          {/each}
        </ul>
      </section>
      {#if error}
        <p class="text-destructive text-sm" role="alert">{error}</p>
      {/if}
    </div>
    <Dialog.Footer class="gap-2 border-t px-6 py-4">
      <Button variant="outline" onclick={() => (open = false)}>Abbrechen</Button>
      <Button onclick={merge}>
        {#if merging}
          <LoaderCircle class="animate-spin motion-reduce:animate-none" aria-hidden="true" />
        {:else}
          <Merge aria-hidden="true" />
        {/if}
        Zusammenführen
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
