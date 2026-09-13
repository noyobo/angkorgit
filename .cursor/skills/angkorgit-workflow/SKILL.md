---
name: angkorgit-workflow
description: >-
  AngKorGit daily ship workflow: real docs, bun commands, test pyramid, feature/bug/PR
  gates. Use when working in the AngKorGit repo on features, bugs, PRs, tests, quality
  checks, or when docs/README/.cursorrules conflict with the actual toolchain.
---

# AngKorGit workflow

Index: [docs/README.md](../../../docs/README.md). Hub lists only files that exist.

## Docs

| File | Use for |
| --- | --- |
| `docs/Development.md` | Commands (ignore its pnpm mention — this repo is bun) |
| `docs/Quality-Checklist.md` | a11y, pre-PR, CI lessons |
| `docs/Testing-Guide.md` | Pyramid: unit vs E2E |
| `docs/E2E-TESTING.md` | E2E against production build, not `dev` |
| `docs/Coding-Standards.md` | Fragment, commits, a11y |
| `CHANGELOG.md` | User-facing changes |

## Toolchain (trust `package.json`)

- Package manager: **bun** (`packageManager: bun@1.4.2`)
- Unit tests: **`bun:test`** (`import { describe, expect, it } from 'bun:test'`) — not Vitest
- E2E: **rstest + Playwright** (`bun run test:e2e`)
- Format: Biome (`bun run format:check` = `biome ci .`)
- Git engine: Rust + libgit2

```bash
bun run dev                 # browser demo mode (UI work)
bun tauri:dev               # full desktop app
bun test                    # unit tests
bun run test:e2e            # Playwright smoke (needs prod build served)
bun run typecheck
bun run format:check
cd apps/desktop/src-tauri && cargo test
```

Pre-PR (Rust touched → also cargo):

```bash
bun run format:check && bun run typecheck && bun test && bun run test:e2e
cd apps/desktop/src-tauri && cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test
```

Husky only runs `lint-staged` → `biome format --write`. That does **not** organize imports. CI runs `biome ci .`. Always `format:check` before push.

## Layout

```
apps/desktop/src/            React (features/, components/, core/ipc.ts + demo.ts)
apps/desktop/src-tauri/      Tauri + git engine (commands.rs thin, core/ per domain)
packages/core/               Pure TS domain (types, graph, forge, AI)
packages/design-system/      tokens.css — no hex in components
tests/unit/*.test.ts         bun:test
tests/e2e/smoke.test.ts      critical user flows only
```

Aliases: `@/` → `apps/desktop/src`, `@angkorgit/core`, `@angkorgit/design-system`.

## Feature

1. Grep first. Duplicate menu items / helpers already exist (`FileActionsMenu`, `toastOutcome`).
2. Interactive UI: `role`, `tabIndex={0}`, `aria-label`, Enter/Space `onKeyDown` from day 1.
3. New git op? Touch the full IPC stack (see `angkorgit-frontend` + `angkorgit-engine`).
4. Unit test first in `tests/unit/{name}.test.ts`. E2E only if a critical user journey changed.
5. User-facing? `CHANGELOG.md`.

## Bug

1. Root cause, not timeout/retry. E2E "not found" → missing `role` 99% of the time. Screenshot, then fix the attribute.
2. Failing unit test first. Patch the shared function, not one caller.
3. Recurring pattern → add a line to `docs/Quality-Checklist.md`.

## Test pyramid

能下沉的下沉. Attributes, structure, pure logic → unit. User journey → E2E (`getByRole`, not CSS class). Never add E2E for implementation details.

E2E must hit a **production** build on `:1420` (`docs/E2E-TESTING.md`). Rspack lazy compilation in `dev` 404s chunks.

## Commits

English. `<type>: <description>` (`feat` `fix` `refactor` `style` `test` `docs` `chore`).

## Forbidden

- Hex colors in components (tokens only: `bg-surface`, `text-foreground`)
- `console.log` / `any` without a reason
- Interactive `<div>` without role/aria/keyboard
- New E2E for non-critical paths
- Inventing docs that are not in `docs/README.md`
