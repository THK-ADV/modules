# AGENTS.md

## Cursor Cloud specific instructions

### Overview

This is **MOCOGi** — a SvelteKit 5 frontend for managing module descriptions, module catalogs, and exam lists at TH Köln, Campus Gummersbach (Faculty 10). It is a **frontend-only** app that proxies API requests to an external backend.

### Key commands

| Task | Command |
|------|---------|
| Install deps | `pnpm install` |
| Dev server | `pnpm dev` (port 5173) |
| Lint | `pnpm lint` |
| Type check | `pnpm check` |
| Build | `pnpm build` |

### Architecture notes

- **No local database or backend** — all data comes from the external API at `BACKEND_URL_PREFIX` (configured in `.env.development`).
- **API proxy** in `src/hooks.server.ts`: `/api/*` routes proxy unauthenticated to the backend; `/auth-api/*` proxies with a Bearer token.
- **Authentication** uses Keycloak OIDC (server-side authorization code flow with PKCE). Tokens stored as httpOnly cookies (`kc-access`, `kc-refresh`).
- **Public routes** (no auth needed): `/`, `/modules`, `/module-catalogs`, `/exam-lists`, `/schedule`, `/help`, `/release-notes`, `/assessment-methods`.
- **Protected routes** (require Keycloak login): `/my-modules`, `/module-approvals`, `/studyprogram`, `/schedule-planning`, `/settings`.

### Known issues (pre-existing)

- `pnpm lint` reports 1 ESLint error in `src/lib/components/forms/date-time-picker.svelte` (svelte/prefer-svelte-reactivity).
- `pnpm check` reports 11 type errors (mostly in `schedule-entry-edit-dialog.svelte` and a missing env export in release-notes).
- `pnpm build` fails because `$env/static/private` vars are not available at build time without a real `.env` file. The dev server (`pnpm dev`) works correctly because it reads from `.env.development`.

### Dev server startup

Run `pnpm dev`. The first request may take a few seconds as Vite optimizes dependencies. The server connects to remote backend/Keycloak endpoints defined in `.env.development` — no local services need to be running.

### No test suite

This project does not have any automated tests configured (no vitest, playwright, or cypress).
