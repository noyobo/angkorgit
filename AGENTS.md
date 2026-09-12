# Agent guide — AngKorGit

Project knowledge for humans lives in [`CLAUDE.md`](./CLAUDE.md). This file is the
**working agreement for coding agents** (and anyone automating changes here).

## Branching

There is **no long-lived `dev` branch**. Trunk is `main`.

1. **Start from current `main`.** Fetch first; do not build on a stale tip.
2. **Cut a short-lived branch** for the work:
   - `feat/<short-name>` — new behavior
   - `fix/<short-name>` — bug fix
   - `chore/<short-name>` / `docs/<short-name>` / `refactor/<short-name>` — as needed
   - Cloud agent runs may use `cursor/<short-name>-…` — same rules otherwise
3. **Open a PR into `main`.** One concern per PR; keep history readable (squash
   related fixups onto the feature commit before merge when the branch is noisy).
4. **Delete the branch after merge.** Do not leave merged feature branches around.

Do **not** recreate `dev`, merge through `dev`, or treat any other branch as an
integration trunk.

## CI

- Pushes to `main` run the full suite.
- Pull requests do **not** run CI by default: drafts are skipped; a ready PR runs
  only after the `ci` label is added (remove the label to stop further runs).
- See `.github/workflows/ci.yml` and `CLAUDE.md` §10.

## Before you change code

1. Read the relevant sections of `CLAUDE.md` (layout, conventions, gotchas).
2. Match existing patterns; no drive-by refactors outside the task.
3. Prefer small, reviewable diffs. Update `CLAUDE.md` / docs when architecture or
   conventions change — not with inline code comments (see `CLAUDE.md` §6.5).

## Upstream

This fork tracks [cheat2001/angkorgit](https://github.com/cheat2001/angkorgit)
independently on `main`. Branches meant for upstream PRs should be based on the
upstream tip (see `upstream-main` when present), not on fork-only commits.
