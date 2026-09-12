# Upstream contribution

This fork is **independently maintained** on `main`. Product work, tooling, and releases land there and are **not** auto-synced from [cheat2001/angkorgit](https://github.com/cheat2001/angkorgit).

## The `upstream/main` branch

Only [`upstream/main`](https://github.com/noyobo/angkorgit/tree/upstream/main) mirrors upstream `main`.

- It is a hard reset to `cheat2001/angkorgit@main` (exact commit match).
- GitHub Actions workflow **Sync upstream/main** refreshes it every six hours and on manual dispatch.
- Do **not** commit fork-specific work onto `upstream/main`.

## Opening a PR to upstream

1. Update the mirror (or wait for the scheduled sync):
   ```bash
   git fetch origin upstream/main
   ```
2. Branch from the mirror:
   ```bash
   git checkout -b fix/short-name origin/upstream/main
   ```
3. Make a change that belongs on upstream (no Bun/Rspack/fork-only edits).
4. Push and open the PR against **`cheat2001/angkorgit`**, base `main`:
   ```bash
   git push -u origin HEAD
   gh pr create --repo cheat2001/angkorgit --base main
   ```

## Local `upstream` remote (optional)

```bash
git remote add upstream https://github.com/cheat2001/angkorgit.git
git fetch upstream main
```

Prefer `origin/upstream/main` (or `refs/heads/upstream/main`) when checking out the mirror branch — a remote named `upstream` makes the short name `upstream/main` ambiguous with `refs/remotes/upstream/main`.
