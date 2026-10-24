- Use the least code necessary to fully achieve a goal
- Prefer simple, concise implementations; avoid unnecessary abstractions
- Do not write tests unless explicitly requested
- Reach for slim and performant code in space and time. Consider appropriate data structures and algorithms
- For frontend work, use the frontend-design skill, follow existing UI patterns, prefer shadcn components and Lucide icons, and ensure accessibility, dark mode support, and responsive layouts
- Define a zod schema in `src/lib/schemas` for every type received from the backend REST API and derive the TypeScript type from it via `z.infer`; do not declare these types by hand
- Load and mutate backend data with remote functions (`query`/`command` in a `*.remote.ts`) instead of `load` in `+page.server.ts`, in this order of priority:
  1. Targeted refresh: `query().refresh()` and single-flight refresh inside a `command` update exactly the affected data, without `invalidate`/`invalidateAll` reloading the whole page
  2. Colocation: query, command and schema live together, and components fetch their own data instead of receiving it via `data` props
  3. SSR is preserved: with `async: true`, awaited queries are resolved during server rendering
- Use `+page.server.ts` only for access checks and redirects before rendering, or when several independent sources must be loaded in parallel and nested component queries would cause request waterfalls
