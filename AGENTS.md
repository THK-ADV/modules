# Agent guidelines

## Code principles

- Use the least code necessary to fully achieve a goal
- Prefer simple, concise implementations; avoid unnecessary abstractions
- Do not write tests unless explicitly requested
- Reach for slim and performant code in space and time. Consider appropriate data structures and algorithms

## Frontend

- For frontend work, use the frontend-design skill, follow existing UI patterns, prefer shadcn components and Lucide icons, and ensure accessibility, dark mode support, and responsive layouts

### Admin and dashboard UX

- Admin and dashboard pages share one UX language (reference: `src/routes/git/publication`):
  - Header: the navigation icon, `h1` and a one-line description; data components render inside a `svelte:boundary` whose pending and failed states keep the header
  - Status box: one bordered `bg-muted/25` section with a status icon, a headline stating the key number, one secondary fact and a refresh action. Show each number once; no extra stats rows or count badges
  - Lists: a `Card` without a heading (the page header and status box already name the content; label the table via `aria-label`) and an optional left-aligned search (`sm:max-w-md`) above a table. Secondary columns appear from `md` and are shown inline below the title on smaller screens. Row actions are always visible icon-only ghost buttons (`size="icon"`, `size-8`) with a `title` tooltip and an `aria-label` naming the row
  - States are text-only outline badges in emerald (new, ok), sky (changed), amber (warning) or red (deleted, destructive), each with dark mode variants
  - Details open in a right side panel next to the list (as in `/my-modules`), full screen on small screens; dialogs are reserved for confirmations and settings. Bulk actions live in a sticky bottom action bar

### Action feedback

- Action feedback: confirm successful saves and updates on the triggering button instead of a success alert or toast. While running, the button shows a spinning `LoaderCircle` in place of its icon; on success, an emerald `Check` and the past participle ("Gespeichert", "Freigegeben") for 2 s. Stack both labels in one grid cell (`grid justify-items-start`, the inactive one `invisible`) so the width stays fixed, and announce the change via `aria-live="polite"`. Do not disable other buttons while a short request runs, since the 50 % opacity flashes; guard concurrent actions in code instead. Errors keep using the error message

### Dialogs and side panels

- Dialog titles name the intended action as a statement, never a question: "2 Prüfungen zusammenführen", "Prüfung löschen", not "Prüfung löschen?". The primary button repeats that verb
- Every dialog with more than a title and a sentence, including confirmations, uses the settings layout (reference: `src/routes/studyprogram/[poId]/exam-list/(components)/exam-list-settings.svelte`):
  - Frame: `sm:max-w-2xl`, `max-h-[90dvh]` with a scrolling body; header and footer are separated by `border-b`/`border-t` and padded `px-6 py-4` (header `pr-12`, so text keeps clear of the close button), the body `px-6 py-6`. Focus the dialog itself on open, not the first control
  - Sections: spaced `space-y-8`; each has an `h3` in `text-base font-semibold`, an optional `text-sm text-muted-foreground` description, and `space-y-4` to its content
  - Rows: lists, choices (radio groups) and settings sit inside a `rounded-xl border divide-y` card, one row per item with `p-4`; a `text-sm font-medium` title and a `text-xs leading-snug text-muted-foreground` description with `space-y-1.5` between them
- Side panels (details next to a list) use the same sections and rows as dialogs; header, body and footer are padded `px-6` like a dialog

### Settings and preferences

- Settings and preferences follow the shadcn settings pattern within the dialog layout above:
  - Placement: settings that apply to a whole page open from an outline "Einstellungen" button (`Settings2` icon) in the status box, which shows the current values as a one-line icon summary and marks the button with a red dot when a setting needs attention
  - Draft: edits go to a draft that "Speichern" applies and persists and "Abbrechen" discards
  - Categories: group related settings into one section and name it after everything it holds (e.g. "Prüfungsphasen und Anmeldezeiträume")
  - Rows: left the label and description, right the control, stacked below `sm`. Controls stay compact (`h-9`, selects about `w-52`, pickers about `w-60`), so they do not outweigh the label
  - Descriptions say what the setting determines, what it preselects, and which side effects a change has. Rows whose control depends on a selection (checkbox) show the dependent input only when selected, and report the impact below the label (counts of affected items, a red text when something is missing)

## Backend data

### Schemas

- Define a zod schema in `src/lib/schemas` for every type received from the backend REST API and derive the TypeScript type from it via `z.infer`; do not declare these types by hand

### Loading and mutating data

- Load and mutate backend data with remote functions (`query`/`command` in a `*.remote.ts`) instead of `load` in `+page.server.ts`, in this order of priority:
  1. Targeted refresh: `query().refresh()` and single-flight refresh inside a `command` update exactly the affected data, without `invalidate`/`invalidateAll` reloading the whole page
  2. Colocation: query, command and schema live together, and components fetch their own data instead of receiving it via `data` props
  3. SSR is preserved: with `async: true`, awaited queries are resolved during server rendering
- Use `+page.server.ts` only for access checks and redirects before rendering, or when several independent sources must be loaded in parallel and nested component queries would cause request waterfalls
