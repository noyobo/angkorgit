---
name: angkorgit-engine
description: >-
  AngKorGit Rust git engine: thin Tauri commands, spawn_blocking, OpOutcome,
  libgit2 core modules, git_engine.rs tests. Use when editing apps/desktop/src-tauri,
  commands.rs, core/*.rs, adding a git operation, or writing cargo integration tests.
---

# AngKorGit git engine

Engine lives in `apps/desktop/src-tauri/src/core/`, one module per domain (`repo`, `branch`, `commit`, `diff`, `history`, `stage`, `remote`, `conflict`, `blame`, `worktree`, `misc`, …).

## Add a git operation (all of these)

1. Implement in `core/<domain>.rs` — libgit2 work, no Tauri types.
2. Thin wrapper in `commands.rs`: parse args, `blocking(move || core::…)`, return serde type.
3. Register in `lib.rs` `generate_handler![…]`.
4. If tests call it, export from `lib.rs` `pub mod test_api`.
5. Integration test in `tests/git_engine.rs` using `TempRepo`.
6. Frontend: `ipc.ts` + `demo.ts` (see `angkorgit-frontend`).

## Command shape

```rust
#[tauri::command]
pub async fn file_blame(
    path: String,
    file: String,
    rev: Option<String>,
) -> AppResult<blame::FileBlame> {
    blocking(move || blame::blame_file(&path, &file, rev.as_deref())).await
}
```

- `blocking()` = `spawn_blocking`. All libgit2 / disk IO goes through it.
- Crate already `#![allow(non_snake_case)]` so IPC args can stay camelCase-friendly; still prefer snake_case Rust fn names matching the invoke string (`file_blame`).
- Return `AppResult<T>` (`error.rs`). Do not unwrap in commands.

## OpOutcome vs error

Merge / rebase / cherry-pick / pull / push that can **pause the repo** return `OpOutcome`, not `Err`:

```rust
pub struct OpOutcome {
    pub status: String, // "ok" | "conflicts" | "up_to_date" | "fast_forward"
    pub message: String,
}
```

Conflicts are a status. Real failures (missing repo, invalid oid) stay `AppError`.

## Types

- Serde structs: `#[serde(rename_all = "camelCase")]` in `core/types.rs` (or the domain module).
- Mirror the same shape in `packages/core/src/git/types.ts` when the UI imports the type.
- Keep commands free of UI policy.

## Tests

`apps/desktop/src-tauri/tests/git_engine.rs`:

- Use crate `test_api` (`use angkorgit_lib::test_api as core`), not git CLI for the behavior under test.
- `TempRepo::new()` inits a real repo and forces branch `master` (CI `init.defaultBranch` may be `main`).
- Cover the new fn: happy path + one failure/edge (missing file, conflicts, empty).
- Run: `cd apps/desktop/src-tauri && cargo test`

Do not add Rust tests that shell out to `git` to assert engine behavior unless setting up fixture state.

## Check before PR

```bash
cd apps/desktop/src-tauri
cargo fmt --check
cargo clippy --all-targets -- -D warnings
cargo test
```
