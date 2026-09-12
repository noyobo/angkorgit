# Pull policy is a tested seam; credentials and advertised_oid stay in remote.rs

Architecture Review candidate #6 asked whether `remote.rs` should be split into smaller internal modules. The review guidance was explicit: **extract only what candidate 3 needs (pull policy). Leave credentials and advertised_oid where they are until a second adapter appears.**

PR #17 (`refactor(remote): extract unified pull policy…`) satisfied this by extracting:
- `PullPolicy` struct reading `pull.rebase`, `pull.ff`, `rebase.autostash` from git config
- `AutoStash` helper managing stash creation and popping
- `apply_pull_policy` function implementing the shared merge/rebase/ff-only logic

Both `pull()` and `pull_branch()` now delegate to these shared components, eliminating duplication and establishing a tested internal seam inside `remote.rs`. Comprehensive integration tests cover all policy combinations for both functions.

**What we are NOT doing**: We are not splitting `make_callbacks`, `advertised_oid`, or the full remote.rs façade into separate adapter modules. The credential chain (accounts → SSH → git credential helper) and the ls-remote probe stay where they are. The pull-policy seam exists because **two real consumers** (`pull` and `pull_branch`) share it. Credentials and `advertised_oid` are deep guts used by multiple remote operations, but they are not adapters requiring substitution — they are shared infrastructure that belongs together.

**Principle**: Don't split the bag for sport. One adapter ≠ a real seam. A second adapter (e.g., a different remote transport) would justify extraction; until then, the pull-policy seam is the only validated split point.

**Status**: accepted (candidate #6 satisfied by PR #17)

**Does not reopen**: ADR 0004 — libgit2 remains the engine; `remote.rs` is still a single git2-based module.

**Related**: docs/PARITY.md documents the tested pull policy behavior and git config alignment.
