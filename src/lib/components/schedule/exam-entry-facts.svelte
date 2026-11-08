<script lang="ts" module>
  import type { ExamEntry, ExamPO } from '$lib/schemas/exam-planning'
  import type { StudyProgram } from '$lib/types/study-program'
  import { examExaminers } from '$lib/types/exam-planning'
  import { fmtStudyProgram, fmtStudyProgramName } from '$lib/formats'

  type POKey = Pick<ExamPO, 'po' | 'specialization'>
  const findStudyProgram = (po: POKey, programs: StudyProgram[]) =>
    programs.find(
      (sp) => sp.po.id === po.po && (sp.specialization?.id ?? null) === po.specialization
    )

  /** Label of a PO relation, the PO id if the study program is unknown. */
  export function fmtExamPO(po: POKey, programs: StudyProgram[]) {
    const sp = findStudyProgram(po, programs)
    return sp ? fmtStudyProgram(sp) : (po.specialization ?? po.po)
  }

  /** Degrees of the study programs, e.g. "B.Eng., B.Sc.". */
  const fmtExamDegrees = (pos: POKey[], programs: StudyProgram[]) =>
    [...new Set(pos.flatMap((po) => findStudyProgram(po, programs)?.degree.deLabel ?? []))]
      .toSorted()
      .join(', ')

  /** Degrees, first examiners and assessment methods of an appointment, shown below its name. */
  export const examSubtitle = (
    entry: Pick<ExamEntry, 'modules' | 'po'>,
    methodLabels: string[],
    programs: StudyProgram[]
  ) =>
    [
      fmtExamDegrees(entry.po, programs),
      examExaminers(entry)
        .map((e) => e.label)
        .join(', '),
      methodLabels.join(', ') || 'Prüfungsform offen'
    ]
      .filter(Boolean)
      .join(' · ')
</script>

<script lang="ts">
  import { Badge } from '$lib/components/ui/badge/index.js'
  import { BookOpen, GraduationCap, MapPin } from '@lucide/svelte'

  let {
    entry,
    studyPrograms,
    editing = false
  }: {
    entry: ExamEntry
    studyPrograms: StudyProgram[]
    /** Leaves out the rooms, which are edited next to the facts. */
    editing?: boolean
  } = $props()

  /** Study programs with their POs, as in the module details; the degree is in the subtitle. */
  const programs = $derived.by(() => {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- local to the derivation
    const groups = new Map<string, { key: string; label: string; versions: Set<number> }>()
    for (const po of entry.po) {
      const sp = findStudyProgram(po, studyPrograms)
      const label = sp ? fmtStudyProgramName(sp) : (po.specialization ?? po.po)
      const key = `${sp?.degree.id}|${label}`
      const group = groups.get(key) ?? { key, label, versions: new Set() }
      if (sp) group.versions.add(sp.po.version)
      groups.set(key, group)
    }
    return [...groups.values()]
      .map((g) => ({ ...g, versions: [...g.versions].toSorted((a, b) => a - b) }))
      .toSorted((a, b) => a.label.localeCompare(b.label, 'de'))
  })

  /** Partition criteria of the rooms; a single one is named once in the section label. */
  const criteria = $derived([...new Set(entry.rooms.flatMap((r) => r.partitionBy ?? []))])
  const partitioned = $derived(entry.rooms.some((r) => r.partitionValue))
</script>

{#snippet label(icon: typeof MapPin, text: string)}
  {@const Icon = icon}
  <span class="text-muted-foreground flex items-center gap-2 text-xs font-medium">
    <Icon class="size-4" aria-hidden="true" />
    {text}
  </span>
{/snippet}

<div class="flex flex-col gap-2">
  {@render label(BookOpen, entry.modules.length === 1 ? 'Modul' : 'Module')}
  {#if entry.modules.length}
    <ul class="space-y-1 text-sm">
      {#each entry.modules as module (module.id)}
        <li>
          {module.title}
          <span class="text-muted-foreground"
            >· {module.abbrev} · {module.ects.toLocaleString('de-DE')} ECTS</span
          >
        </li>
      {/each}
    </ul>
  {:else}
    <p class="text-sm">–</p>
  {/if}
</div>

{#if !editing}
  <div class="flex flex-col gap-3">
    {@render label(
      MapPin,
      criteria.length === 1
        ? `${entry.rooms.length === 1 ? 'Raum' : 'Räume'} nach ${criteria[0]}`
        : entry.rooms.length === 1
          ? 'Raum'
          : 'Räume'
    )}
    {#if entry.rooms.length}
      <!-- The participant range leads each row, so everyone finds their room at a glance. -->
      <ul class="grid gap-x-5 gap-y-4 {partitioned ? 'grid-cols-[auto_1fr]' : ''}">
        {#each entry.rooms as room (room.id)}
          <li class="col-span-full grid grid-cols-subgrid items-baseline">
            {#if partitioned}
              <span>
                <span class="text-base font-semibold tabular-nums"
                  >{room.partitionValue ?? '–'}</span
                >
                {#if criteria.length > 1 && room.partitionBy}
                  <span class="text-muted-foreground block text-xs">{room.partitionBy}</span>
                {/if}
              </span>
            {/if}
            <span class="min-w-0 text-sm">
              <span class="font-medium">{room.abbrev}</span>
              <span class="text-muted-foreground">{room.label}</span>
              {#if room.invigilators.length}
                <span class="text-muted-foreground mt-0.5 block text-xs">
                  Aufsicht: {room.invigilators.map((i) => i.label).join(', ')}
                </span>
              {/if}
            </span>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="text-muted-foreground text-sm">Noch kein Raum zugeordnet</p>
    {/if}
  </div>
{/if}

{#if programs.length}
  <div class="flex flex-col gap-2">
    {@render label(GraduationCap, 'Studiengänge')}
    <ul class="space-y-1.5 text-sm">
      {#each programs as row (row.key)}
        <li class="flex flex-wrap items-center gap-1">
          <span class="font-medium">{row.label}</span>
          {#each row.versions as version (version)}
            <Badge variant="outline">PO {version}</Badge>
          {/each}
        </li>
      {/each}
    </ul>
  </div>
{/if}
