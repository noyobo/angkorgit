# Git CLI Parity Notes

This document tracks behavioral alignment between AngKorGit's libgit2-based engine and Git CLI 2.55+.

## Architecture Context

**AngKorGit** uses libgit2 (via Rust `git2` crate). Decision: [ADR 0004](./adr/0004-libgit2-is-the-engine.md).
**GitHub Desktop** shells to embedded git CLI (dugite).

This trade-off requires **deliberate semantic alignment** where libgit2 and git CLI differ. Oracle for Remote effects is CI's `git`, not a second engine.

## Implemented Parity (2026-09-11)

### P0: Network Operations (Server-Side Effects)

| Feature | Implementation | Status |
|---------|----------------|--------|
| Push up-to-date short-circuit | `advertised_oid()` check before push (#4, bc040ec) | ✅ |
| Push delete short-circuit | Check `advertised_oid`, return `up_to_date` when absent | ✅ |
| Push tag short-circuit | Compare local tag oid with `advertised_oid` | ✅ |
| Force-with-lease | Compare advertised remote tip with expected upstream; refuse when moved | ✅ |

**Pattern**: All network mutations check **live remote advertisement** before contacting receive-pack to avoid spurious CI/webhook triggers.

### P1: Core Workflow Parity

| Feature | Implementation | Status |
|---------|----------------|--------|
| Client hooks | `pre-commit`, `commit-msg`, `pre-push` via hooks.rs | ✅ |
| Pull policy | Respects `pull.rebase`, `pull.ff`, `rebase.autostash` | ✅ |
| Branch delete safety | Safe (-d): refuses unmerged; Force (-D): always deletes | ✅ |
| Fetch outcome | `up_to_date` when `received_objects == 0` | ✅ |

### P2: Polish & Edge Cases

| Feature | Implementation | Status |
|---------|----------------|--------|
| Remote remove cleanup | Scrub empty `[remote]` config stanzas after delete | ✅ |
| Clone default branch | Honor `init.defaultBranch` config | ✅ |
| Reset --keep | Refuse when local changes would be lost | ✅ |
| Submodule --recursive | Recursively update nested submodules | ✅ |
| Stale branch detection | `list_stale_locals()` for upstream-gone cleanup | ✅ |

## Merge/Rebase Strategy

**Current**: libgit2 uses its default merge strategy (similar to git's `recursive`).

**Git CLI 2.34+**: Defaults to `ort` (Ostensibly Recursive's Twin) — a rewrite of `recursive` with better performance and edge-case handling.

**Impact**: Merge behavior is **functionally equivalent** for normal cases. Complex 3-way merges with extensive renames or nested conflicts *may* differ in conflict presentation.

**Recommendation**: Document this as a known difference. Full `ort` parity requires either:
1. Waiting for libgit2 upstream to adopt `ort`
2. Shelling to `git merge` for complex cases (defeats the libgit2 size benefit)

Current approach is **acceptable** — conflicts are rare enough that the size/perf trade-off wins.

## Progress Indicators for Large Operations

**Current**: libgit2 provides `transfer_progress` callbacks (used for fetch, clone).

**Gaps**:
- `checkout_tree` (used by branch checkout, reset --hard) has no built-in progress callback
- Large checkouts can **appear frozen** without feedback

**Approach**:
1. **Clone**: Already reports progress via `transfer_progress` → `on_progress` callback
2. **Fetch**: Reports `received_objects` for up-to-date detection
3. **Checkout/Reset**: No progress yet

**Recommendation**: 
- Add a "Checking out..." busy indicator in UI when checkout/reset is called
- Consider adding a timeout warning for operations >5s
- Full progress requires libgit2 to expose checkout progress or shelling to `git checkout`

**Status**: Documented as known limitation. UI-level busy indicators are acceptable for v1.

## Discard Path Parity vs `git restore`

**git restore** (Git 2.23+) replaced `git checkout -- <paths>` with clearer semantics:
- `git restore <file>`: Restore working tree from index (discard unstaged changes)
- `git restore --staged <file>`: Restore index from HEAD (unstage)
- `git restore --source=<tree> <file>`: Restore from specific commit

**AngKorGit current**:
- `discard_file` / `discard_all`: `checkout_tree` from HEAD (working tree + index)
- `discard_staged_file` / `discard_staged_all`: `checkout_tree` from HEAD for staged paths
- Both paths are **destructive** and match git CLI safety (refuses submodules, returns leftovers)

**Audit result**: ✅ **Aligned**. AngKorGit's discard operations match `git restore` semantics:
- Unstaged discard = `git restore <file>`
- Staged discard = `git restore --source=HEAD --worktree --staged <file>`

No gaps found.

## Shallow / Sparse / Partial Clone

**Status**: **Deferred** (not implemented)

**Rationale**:
- **Shallow clone** (`--depth`): libgit2 supports it (`RepoBuilder::depth`), but:
  - Adds UI complexity (depth picker, unshallow affordance)
  - Use case is niche for a desktop client (CI/large-monorepo bots need it more)
  - Full clones are acceptable for typical repo sizes users open in a GUI
  
- **Sparse checkout**: libgit2 API exists but is low-level
  - Requires `.git/info/sparse-checkout` management
  - CLI shelling (`git sparse-checkout`) is simpler but defeats size goal
  - Use case overlaps with submodules (which we support)

- **Partial clone** (filter blobs): Git 2.19+ feature
  - libgit2 support is experimental/incomplete as of 2026
  - Requires server-side support (GitHub/GitLab have it, self-hosted may not)
  - Adds fetch complexity (lazy blob loading)

**Decision**: Implement **only if** product feedback shows demand. Current shallow/sparse use cases:
- CI: Not our target (Drone/Actions use CLI)
- Monorepos: Users opening 10GB+ repos in a GUI is rare
- Mobile/constrained: Desktop app, not mobile

Mark as **explicit non-goal** unless user reports make it P0.

## LFS (Large File Storage)

**Status**: **Explicit non-goal**

**Current behavior**: LFS pointer files are treated as **normal blobs** (no smudge/clean filter).

**What this means**:
- Cloning an LFS repo fetches only pointer files (small)
- Opening/diffing shows the pointer text, not actual content
- Committing large files creates normal git blobs (repo bloat)

**Why not implement**:
- LFS requires `git-lfs` binary (defeats our size advantage)
- Smudge/clean filters need process spawning on every checkout/commit
- libgit2 has no first-class LFS support (filter API is low-level)
- Users with LFS repos likely also use terminal git (where LFS works normally)

**Recommendation**: Document clearly in UI/docs:
> "AngKorGit does not manage LFS files. Pointer files appear as text. Use terminal git for LFS operations."

If users **must** have LFS in-app, the path is:
1. Shell to `git lfs pull` / `git lfs push` commands
2. Detect `.gitattributes` LFS entries and warn user
3. Add UI affordance for manual LFS sync

This would add ~50 MB to bundle (git-lfs binary) and process overhead.

**Decision**: Reject unless multiple users escalate it. Most LFS users are comfortable with terminal git.

## Worktree Parity

**Implemented** (issue #6 mentions tests):
- `worktree::list` / `add` / `remove` / `prune`
- Checkout guards (refuses branches held elsewhere)
- Watcher integration (sibling worktree changes trigger refresh)

**Tests exist**: `apps/desktop/src-tauri/tests/git_engine.rs` covers:
- Add with existing/new/remote branch
- Remove (dirty/clean/force)
- Prune (missing folders)
- Checkout refusal when branch is held elsewhere
- `git worktree list` CLI interop verification

**Status**: ✅ **Aligned**. No gaps vs git CLI worktree behavior.

## Summary Table

| Category | Git CLI 2.55 | AngKorGit | Notes |
|----------|--------------|-----------|-------|
| **Network short-circuits** | ls-remote before push | ✅ `advertised_oid` | Parity |
| **Force-with-lease** | `--force-with-lease` | ✅ Lease via tracking ref | Parity |
| **Hooks** | pre-commit, pre-push, etc. | ✅ Optional hooks.rs | Parity |
| **Pull modes** | merge/rebase/ff-only | ✅ Config-driven | Parity |
| **Branch delete** | -d (safe) / -D (force) | ✅ Merged check | Parity |
| **Fetch status** | Silent when up-to-date | ✅ `up_to_date` status | Parity |
| **Reset --keep** | Refuses lossy resets | ✅ Local-change guard | Parity |
| **Submodule --recursive** | Nested updates | ✅ Recursive walk | Parity |
| **Merge strategy** | `ort` default | ⚠️ `recursive`-like | Close enough |
| **Checkout progress** | Terminal feedback | ⚠️ No progress yet | UI busy indicator OK |
| **Shallow/sparse clone** | CLI flags | ❌ Not implemented | Deferred (niche) |
| **LFS** | git-lfs filters | ❌ Pointer files as text | Explicit non-goal |
| **Worktrees** | Full CLI parity | ✅ Aligned + tested | Parity |
| **Discard safety** | `git restore` | ✅ Aligned | Parity |

## Testing Strategy

All behavioral changes are covered by integration tests in `apps/desktop/src-tauri/tests/git_engine.rs`.

**Test naming convention**: `<operation>_<scenario>` (e.g., `push_delete_is_up_to_date_when_ref_already_gone`).

**Coverage as of 2026-09-11**:
- P0/P1 features: ✅ Tested
- P2 features: Partially tested (merge strategy, progress are documented limitations)
- Worktree: ✅ Comprehensive test suite
- Pull policy: ✅ Comprehensive test suite (pull.rebase, pull.ff, rebase.autostash for both pull and pull_branch)

**Future**: Add tests for:
- Hook execution (pre-commit failure blocks commit)
- Reset --keep refusal cases

## References

- Issue #4: Push up-to-date still triggered CI
- Issue #5: libgit2 vs git CLI 2.39.5 audit
- Issue #6: libgit2 vs git CLI 2.55 command matrix
- Git 2.55 release notes: https://github.com/git/git/blob/master/Documentation/RelNotes/2.55.0.txt
- libgit2 documentation: https://libgit2.org/docs/
