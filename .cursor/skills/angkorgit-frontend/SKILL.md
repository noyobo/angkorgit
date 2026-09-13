---
name: angkorgit-frontend
description: >-
  AngKorGit React/IPC/demo UI patterns: dual-path ipc.ts, demo.ts, design tokens,
  accessibility, Zustand stores. Use when editing apps/desktop/src, packages/core,
  packages/design-system, CommandPalette, Sidebar, DiffViewer, or adding a frontend
  command/demo stub.
---

# AngKorGit frontend

UI work in **demo mode** (`bun run dev`) unless the bug is Tauri/libgit2-only.

## IPC is the seam

`apps/desktop/src/core/ipc.ts` is the only frontend→backend boundary.

Every new command needs **both** branches:

```typescript
async fileBlame(path: string, file: string, rev?: string | null): Promise<FileBlame> {
  if (!isTauri()) {
    await delay(150);
    return demo.demoFileBlame(file, rev ?? null);
  }
  return invoke('file_blame', { path, file, rev });
}
```

- `isTauri()` false → `demo.ts` synthetic data (Playwright + `bun run dev`)
- Command name = Rust fn name (`file_blame`)
- Args camelCase, match `#[tauri::command]` params (`path`, `file`, `rev`)
- Pausable git ops return `OpOutcome` (`ok` | `conflicts` | `up_to_date` | `fast_forward`), not thrown errors. Surface with existing `toastOutcome()` from `@/shared/toastOutcome`

Shared domain types live in `@angkorgit/core` (`packages/core/src/git/types.ts`). Keep them in sync with Rust `serde(rename_all = "camelCase")` structs.

## Where UI goes

| Kind | Path |
| --- | --- |
| Feature UI + local store | `apps/desktop/src/features/<domain>/` |
| Shared chrome | `apps/desktop/src/components/` |
| Global UI/workspace | `apps/desktop/src/features/ui/store.ts` (Zustand + persist) |
| Repo state | `apps/desktop/src/features/repository/store.ts` |
| Pure logic | `packages/core/src/` — unit-test here, not in JSX |

Reuse: `FileActionsMenu`, `PaletteShell`, `confirm.tsx`, `useListFocus`, `useShortcuts`. Grep before adding a menu item.

## Accessibility (required)

E2E uses `getByRole`. Interactive non-semantic nodes need all four:

```tsx
<div
  role="button"
  tabIndex={0}
  aria-label="Clear filters"
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
```

Prove it with a **unit** test that reads the source (`tests/unit/accessibility.test.ts` pattern), not a new E2E.

## Visual

- Colors via tokens only (`bg-surface`, `bg-surface-raised`, `text-foreground`, `text-muted`, `border-border`). Tokens: `packages/design-system/src/tokens.css`
- No hex in components
- Explicit `<Fragment>` / `import { Fragment } from 'react'` — no `<>`
- Large lists: `@tanstack/react-virtual` (see `VirtualDiff`, commit graph)
- `.no-drag` on interactive controls inside the title-bar drag region

## Tests

- New pure fn → `tests/unit/<name>.test.ts` with `bun:test`
- Structure/a11y → source-string asserts, same as `accessibility.test.ts`
- Critical user journey only → `tests/e2e/smoke.test.ts` (`getByRole` / visible text)
- UI verification: `bun run dev` (demo dataset). Full git: `bun tauri:dev`

## AI provider (rare)

HTTP adapter: `packages/core/src/ai/providers.ts` → register in `createAiProvider` + `AI_PROVIDER_PRESETS`.
CLI agent: `packages/core/src/ai/cliAgents.ts` + allowlist in `apps/desktop/src-tauri/src/ai_cli.rs`.
