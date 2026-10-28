- Use the least code necessary to fully achieve a goal
- Prefer simple, concise implementations; avoid unnecessary abstractions
- Do not write tests unless explicitly requested
- Reach for slim and performant code in space and time. Consider appropriate data structures and algorithms
- For frontend work, use the frontend-design skill, follow existing UI patterns, prefer shadcn components and Lucide icons, and ensure accessibility, dark mode support, and responsive layouts
- Admin and dashboard pages share one UX language (reference: `src/routes/git/publication`):
  - Header: the navigation icon, `h1` and a one-line description; data components render inside a `svelte:boundary` whose pending and failed states keep the header
  - Status box: one bordered `bg-muted/25` section with a status icon, a headline stating the key number, one secondary fact and a refresh action. Show each number once; no extra stats rows or count badges
  - Lists: a `Card` with a heading and optional search above a table. Secondary columns appear from `md` and are shown inline below the title on smaller screens. Row actions are always visible ghost buttons whose text appears from `lg`
  - States are text-only outline badges in emerald (new, ok), sky (changed), amber (warning) or red (deleted, destructive), each with dark mode variants
  - Details open in a right side panel next to the list (as in `/my-modules`), full screen on small screens; dialogs are reserved for confirmations. Bulk actions live in a sticky bottom action bar
- Define a zod schema in `src/lib/schemas` for every type received from the backend REST API and derive the TypeScript type from it via `z.infer`; do not declare these types by hand
- Load and mutate backend data with remote functions (`query`/`command` in a `*.remote.ts`) instead of `load` in `+page.server.ts`, in this order of priority:
  1. Targeted refresh: `query().refresh()` and single-flight refresh inside a `command` update exactly the affected data, without `invalidate`/`invalidateAll` reloading the whole page
  2. Colocation: query, command and schema live together, and components fetch their own data instead of receiving it via `data` props
  3. SSR is preserved: with `async: true`, awaited queries are resolved during server rendering
- Use `+page.server.ts` only for access checks and redirects before rendering, or when several independent sources must be loaded in parallel and nested component queries would cause request waterfalls
