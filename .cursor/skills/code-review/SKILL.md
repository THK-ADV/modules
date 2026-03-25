---
name: code-review
description: Review code for correctness, robustness, security, and maintainability following this SvelteKit + Tailwind + shadcn + TanStack Table + bits-ui codebase conventions. Use when the user asks for a code review, asks to review staged changes, or requests review/fix/verify for this stack.
---

# Code Review Skill

## When to use

Use this skill when reviewing code changes in a SvelteKit + Tailwind + shadcn + TanStack Table + bits-ui codebase, especially UI/table/filter/pagination and related data-loading code (`page.ts`, `server.ts`).

## Output format (guidance-only, no pre-summary)

Start with findings directly. Do **not** include a standalone “summary of changes/features”. Do **not** commit after the review.

Present findings ordered by severity:

- `CRITICAL`: must-fix issues with file/code reference and concrete recommendation.
- `MAJOR`: important behavioral/regression issues with file/code reference and concrete recommendation.
- `MINOR`: readability/style/performance issues with file/code reference and recommendation.
- `NOTES`: best-practice suggestions and questions.

Keep code snippets minimal; default to guidance-only unless the user explicitly asks for patch-level code.

## Review workflow

1. **Correctness + edge cases**: verify nullish/optional handling, boundary conditions, and runtime behavior.
2. **TypeScript + web-dev robustness**: check falsy vs nullish semantics, unsafe casts/assertions, and incorrect assumptions about external data. Flag obvious XSS/security risks where applicable.
3. **SvelteKit architecture** (if relevant): review `page.ts`, `server.ts`/endpoints, loaders, and data flow boundaries (serialization, error handling via `error()`, SSR vs client separation).
4. **Svelte reactivity/SSR pitfalls**: validate `$derived`/`$state` usage, module scripts vs instance scripts, and ensure client-only logic is safe.
5. **TanStack Table correctness**: sorting/filtering correctness, `sortingFn` null-safety, accessor/value shapes, and any responsive column visibility behavior (avoid layout-dependent semantics unless intentionally aligned with the UI).
6. **Tailwind/shadcn classes**: responsive prefixes, overflow/min-width issues (`min-w-0`, `overflow-x-auto`), and redundant/overcomplex class strings.
7. **Data contract consistency**: ensure types match API payloads and UI usage (e.g. field naming mismatches like `abbrev` vs `abbreviation`, optional fields).
8. **Inefficient data structures/algorithms**: flag repeated O(n^2) loops, repeated sorting inside loops, and opportunities to use `Set`/`Map` for membership checks.
9. **Readability + simplification**: remove duplication, simplify conditionals, ensure helpers are focused and named consistently.
10. **Accessibility**: verify icon-only controls have labels/ARIA and tooltips behave accessibly where used.
11. **Risk notes + open questions**: list any remaining uncertainties or follow-up checks.

## Anti-patterns to flag automatically

- Mutating derived state or using layout-only conditions inside sorting/accessors in a way that can desync from what users see.
- Sorting/formatting based on rendered text/DOM rather than stable underlying data keys.
- Unsafe array indexing in sort/compare logic (e.g. `arr[0]` without empty checks).
- Overly complex CSS/class stacks that don’t actually solve the underlying layout issue.
- Falsy checks where `0`, `''`, or `false` are valid values (prefer explicit comparisons or nullish coalescing).
- Type assertions that bypass real validation for external data.
- Server/client boundary mistakes (accidentally importing server-only logic into client code).

## If you need more info

Ask one or two focused questions if you cannot determine correctness from the code alone (e.g., expected API payload shape, whether data is client-only or SSR).
