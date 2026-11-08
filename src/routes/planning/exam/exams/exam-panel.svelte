<script lang="ts" module>
  import type { Exam, ExamModule } from '$lib/schemas/exams'

  export type ExamPanelMode =
    | { kind: 'create'; name: string; modules: string[] }
    | { kind: 'edit'; exam: Exam }

  /** A module to choose from with the number of exams it belongs to. */
  export type ModuleOption = ExamModule & { examCount: number }
</script>

<script lang="ts">
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { Button } from '$lib/components/ui/button/index.js'
  import { Input } from '$lib/components/ui/input/index.js'
  import { examWriteSchema } from '$lib/schemas/exams'
  import { getErrorMessage } from '$lib/errors'
  import { cn } from '$lib/utils'
  import { Check, LoaderCircle, Plus, Save, Trash2, X } from '@lucide/svelte'
  import { untrack } from 'svelte'
  import OptionPicker from '../(components)/option-picker.svelte'
  import { stateBadge } from '../(components)/exam-planning'
  import { createExam, updateExam } from './exams.remote'

  let {
    mode,
    modules,
    // eslint-disable-next-line no-useless-assignment -- required for Svelte bindable prop
    dirty = $bindable(false),
    closable = true,
    onClose,
    onCreated,
    onDelete
  }: {
    mode: ExamPanelMode
    /** All assignable modules by id. */
    modules: Map<string, ModuleOption>
    dirty?: boolean
    /** Shows an own close button; a sheet brings its own. */
    closable?: boolean
    onClose: () => void
    onCreated: (exam: Exam) => void
    onDelete: (exam: Exam) => void
  } = $props()

  const exam = $derived(mode.kind === 'edit' ? mode.exam : null)
  const sameModules = (a: string[], b: string[]) =>
    a.length === b.length && a.every((id) => b.includes(id))
  let name = $state(untrack(() => (mode.kind === 'edit' ? mode.exam.name : mode.name)))
  let selected = $state(
    untrack(() => (mode.kind === 'edit' ? mode.exam.modules.map((m) => m.id) : mode.modules))
  )
  let savedName = $state(untrack(() => name))
  let savedModules = $state(untrack(() => selected))
  $effect(() => {
    dirty = name !== savedName || !sameModules(selected, savedModules)
  })

  // Takes over the refreshed exam, e.g. a module added from the list, keeping unsaved edits.
  $effect.pre(() => {
    if (!exam) return
    const nextName = exam.name
    const nextModules = exam.modules.map((m) => m.id)
    untrack(() => {
      if (name === savedName) name = nextName
      if (sameModules(selected, savedModules)) selected = nextModules
      savedName = nextName
      savedModules = nextModules
    })
  })

  let busy = $state(false)
  /** Past participle of the action that just succeeded. */
  let done = $state<string>()
  let error = $state<string>()

  async function save() {
    if (busy) return
    const parsed = examWriteSchema.safeParse({ name, modules: selected })
    if (!parsed.success) return (error = parsed.error.issues[0].message)
    busy = true
    error = undefined
    const submitted = { name, modules: selected }
    const label = exam ? 'Gespeichert' : 'Angelegt'
    try {
      const saved = exam
        ? await updateExam({ id: exam.id, ...parsed.data })
        : await createExam(parsed.data)
      const savedIds = saved.modules.map((module) => module.id)
      // Edits made while the request ran stay unsaved.
      if (name === submitted.name) name = saved.name
      if (sameModules(selected, submitted.modules)) selected = savedIds
      savedName = saved.name
      savedModules = savedIds
      if (!exam) onCreated(saved)
      done = label
      setTimeout(() => done === label && (done = undefined), 2000)
    } catch (e) {
      error = getErrorMessage(e)
    } finally {
      busy = false
    }
  }

  const options = $derived(
    [...modules.values()].map((m) => ({
      id: m.id,
      label: m.title,
      hint:
        m.abbrev +
        (m.examCount === 0
          ? ' · ohne Prüfung'
          : m.examCount > 1
            ? ` · ${m.examCount} Prüfungen`
            : '')
    }))
  )
  const toggle = (id: string) =>
    (selected = selected.includes(id) ? selected.filter((m) => m !== id) : [...selected, id])
</script>

<div class="flex h-full min-h-0 flex-col">
  <div class="flex items-start justify-between gap-4 border-b py-4 pr-4 pl-6">
    <h2
      class="text-lg font-semibold tracking-tight wrap-anywhere outline-none"
      tabindex="-1"
      {@attach (node) => node.focus()}
    >
      {exam ? exam.name : 'Neue Prüfung'}
    </h2>
    {#if closable}
      <Button variant="ghost" size="icon" class="size-9 shrink-0" onclick={onClose}>
        <X aria-hidden="true" />
        <span class="sr-only">Schließen</span>
      </Button>
    {/if}
  </div>

  <div class="min-h-0 flex-1 space-y-8 overflow-y-auto px-6 py-6">
    <section class="space-y-4">
      <div class="space-y-1">
        <h3 class="text-base font-semibold"><label for="exam-name">Name</label></h3>
        <p class="text-muted-foreground text-sm">
          Erscheint in Prüfungslisten und im Prüfungsplan; muss nicht eindeutig sein.
        </p>
      </div>
      <Input id="exam-name" class="h-9" bind:value={name} />
    </section>

    <section class="space-y-4">
      <div class="space-y-1">
        <h3 id="exam-modules" class="text-base font-semibold">Module</h3>
        <p class="text-muted-foreground text-sm">
          Prüfende, Prüfungsformen und Prüfungsphasen kommen aus diesen Modulen.
        </p>
      </div>
      {#if selected.length}
        <ul class="divide-y rounded-xl border" aria-labelledby="exam-modules">
          {#each selected as id (id)}
            {@const module = modules.get(id)}
            {@const title = module?.title ?? 'Unbekanntes Modul'}
            <li class="flex items-center gap-2 py-3 pr-3 pl-4">
              <div class="min-w-0 flex-1 space-y-1.5 py-1 text-sm">
                <p class="font-medium wrap-anywhere">
                  {title}
                  {#if module && module.status !== 'active'}
                    <Badge variant="outline" class={cn('ml-1 font-normal', stateBadge.warning)}
                      >Inaktiv</Badge
                    >
                  {/if}
                </p>
                {#if module}
                  <p class="text-muted-foreground text-xs">
                    {module.abbrev} · {module.ects} ECTS · {module.firstExaminer.label}
                  </p>
                {/if}
              </div>
              <Button
                variant="ghost"
                size="icon"
                class="size-8 shrink-0"
                aria-label="{title} entfernen"
                onclick={() => toggle(id)}
              >
                <X aria-hidden="true" />
              </Button>
            </li>
          {/each}
        </ul>
      {/if}
      <OptionPicker
        class="w-full"
        multiple
        {options}
        {selected}
        onSelect={toggle}
        label="Module auswählen"
      />
    </section>

    {#if error}
      <p class="text-destructive text-sm" role="alert">{error}</p>
    {/if}
    <Button onclick={save}>
      {#if busy}
        <LoaderCircle class="animate-spin motion-reduce:animate-none" aria-hidden="true" />
      {:else if done}
        <Check class="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
      {:else if exam}
        <Save aria-hidden="true" />
      {:else}
        <Plus aria-hidden="true" />
      {/if}
      <span class="grid justify-items-start" aria-live="polite">
        <span class={cn('col-start-1 row-start-1', done && 'invisible')}
          >{exam ? 'Speichern' : 'Anlegen'}</span
        >
        <span class={cn('col-start-1 row-start-1', !done && 'invisible')}>{done}</span>
      </span>
    </Button>
  </div>

  {#if exam}
    <div class="flex border-t px-6 py-4">
      <Button
        variant="ghost"
        size="sm"
        class="ml-auto text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
        onclick={() => onDelete(exam)}
      >
        <Trash2 aria-hidden="true" />
        Prüfung löschen
      </Button>
    </div>
  {/if}
</div>
