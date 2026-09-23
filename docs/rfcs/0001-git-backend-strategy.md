# RFC 0001: Git Backend Strategy - CLI vs libgit2

---
**Status**: Proposed  
**Author**: Cursor Agent  
**Created**: 2026-09-23  
**Updated**: 2026-09-23  
**Discussion**: [Issue #TBD]

---

## Summary

Propose a clear strategy for choosing between libgit2 and Git CLI as the backend for Git operations in Bayon, replacing the current all-libgit2 approach with a hybrid architecture that maximizes simplicity while preserving performance where it matters.

## Motivation

### Current State

Bayon currently uses libgit2 (via git2-rs) for all Git operations. While this provides good performance and cross-platform consistency, it introduces several challenges:

1. **Maintenance Burden**
   - Need to track libgit2 updates and git2-rs compatibility
   - Complex build process (vendored-libgit2)
   - Team needs deep understanding of libgit2 API semantics

2. **Behavior Divergence Risk**
   - libgit2 implementation may differ from Git CLI in edge cases
   - Users experience "works in terminal, doesn't work in Bayon" confusion
   - Difficult to debug issues that don't reproduce with `git` command

3. **Feature Lag**
   - New Git features require libgit2 support first
   - Workarounds needed for missing features
   - Cannot leverage latest Git CLI improvements

4. **AI Era Context**
   - Modern developers always have Git CLI installed
   - AI tools expect Git CLI behavior and output
   - Developer workflows heavily use terminal + AI

### The Question

**Do we still need libgit2 for everything, or can we simplify by using Git CLI where appropriate?**

## Proposal

### Core Principle

**Use Git CLI by default, libgit2 only for performance-critical paths**

Rationale:
- 90% of operations are infrequent or network-bound → CLI performance is fine
- 10% of operations are performance-critical → libgit2 provides measurable benefit
- Clear boundaries make the codebase easier to understand and maintain

### Decision Matrix

| Scenario | Backend | Reasoning |
|----------|---------|-----------|
| **High-frequency operations** | | |
| Status checking (on file save) | libgit2 | Called >10x/sec, needs <10ms response |
| Real-time diff (while typing) | libgit2 | Called on every keystroke, needs <5ms |
| Commit graph traversal | libgit2 | Needs to walk 1000s of commits incrementally |
| File history | libgit2 | Traverses tree objects across commits |
| **Network operations** | | |
| Fetch / Pull / Push | CLI | Credential management, SSH keys, progress |
| Clone | CLI | Initial setup, user expects CLI behavior |
| **Write operations** | | |
| Stage / Unstage / Commit | CLI | User expects exact CLI behavior |
| Branch create/delete | CLI | Simple, reliable |
| Checkout | CLI | Affects working directory, CLI is safer |
| Merge / Rebase / Cherry-pick | CLI | Complex conflict handling |
| **Query operations** | | |
| Show commit | CLI | Infrequent, simple |
| Blame file | CLI | `git blame` is well-optimized |
| Diff files | CLI | One-time operation |
| Search commits | CLI | `git log -S` is optimized |

### Architecture

```
┌─────────────────────────────────────────┐
│           Unified Git Engine            │
│  (src-tauri/src/git/engine.rs)          │
└───────────┬─────────────────────────────┘
            │
            ├──────────────┬──────────────┐
            ▼              ▼              ▼
    ┌──────────────┐  ┌─────────┐  ┌─────────┐
    │ libgit2 Ops  │  │ CLI Ops │  │ Hybrid  │
    │  (4 ops)     │  │ (all    │  │ Ops     │
    │              │  │ others) │  │         │
    └──────────────┘  └─────────┘  └─────────┘
         │                 │             │
         ▼                 ▼             ▼
    • load_commits    • fetch       • diff
    • get_status      • pull          (CLI for files,
    • real_time_diff  • push          libgit2 for
    • file_history    • stage         real-time)
                      • commit
                      • blame
                      • show
                      • ...
```

### Implementation Plan

#### Phase 1: Foundation (Week 1-2)

**Goal**: Set up infrastructure for CLI operations

1. Create `cli_backend.rs` module
   ```rust
   // src-tauri/src/git/cli_backend.rs
   pub struct GitCli {
       repo_path: PathBuf,
       process_pool: Arc<ThreadPool>,
   }
   
   impl GitCli {
       pub fn fetch(&self, remote: &str) -> Result<()> {
           self.run_git(&["fetch", remote])
       }
       
       pub fn stage(&self, files: &[String]) -> Result<()> {
           self.run_git_with_args("add", files)
       }
       
       fn run_git(&self, args: &[&str]) -> Result<Output> {
           Command::new("git")
               .args(args)
               .current_dir(&self.repo_path)
               .output()
       }
   }
   ```

2. Add feature flag for gradual rollout
   ```toml
   # Cargo.toml
   [features]
   default = ["libgit2-only"]
   libgit2-only = []
   hybrid-backend = []
   cli-only = []  # Future: for testing
   ```

3. Create test suite comparing outputs
   ```rust
   #[test]
   fn compare_status_libgit2_vs_cli() {
       let status_libgit2 = libgit2_ops::get_status(&repo)?;
       let status_cli = cli_ops::get_status(&repo)?;
       assert_eq!(status_libgit2, status_cli);
   }
   ```

#### Phase 2: Network Operations → CLI (Week 3-4)

**Goal**: Move safest operations first (biggest maintenance win)

Operations to migrate:
- ✅ Fetch
- ✅ Pull  
- ✅ Push
- ✅ Clone

**Why start here?**
- Lowest risk (network operations already complex in libgit2)
- Biggest maintenance relief (credential management is hard)
- User-facing behavior exactly matches CLI

**Success Criteria**:
- All network operations use CLI
- Credential helpers work (SSH, HTTPS, Git Credential Manager)
- Progress reporting works
- No regression in user experience

#### Phase 3: Write Operations → CLI (Week 5-6)

**Goal**: Ensure user expectations match CLI behavior

Operations to migrate:
- ✅ Stage/Unstage
- ✅ Commit
- ✅ Branch operations
- ✅ Checkout
- ✅ Merge/Rebase
- ✅ Stash

**Success Criteria**:
- "Works in terminal = works in Bayon"
- Commit hooks execute correctly
- Gitattributes respected
- Working directory operations safe

#### Phase 4: Query Operations → CLI (Week 7-8)

**Goal**: Simplify infrequent operations

Operations to migrate:
- ✅ Show commit
- ✅ Blame
- ✅ Diff (non-realtime)
- ✅ Search

**Success Criteria**:
- Output parsing is robust
- Error messages are clear
- Performance is acceptable (<100ms)

#### Phase 5: Optimization & Benchmarking (Week 9-10)

**Goal**: Validate performance assumptions, optimize where needed

1. Benchmark all operations
   ```rust
   #[bench]
   fn bench_load_commits_libgit2(b: &mut Bencher) { /* ... */ }
   
   #[bench]
   fn bench_load_commits_cli(b: &mut Bencher) { /* ... */ }
   ```

2. Profile real-world usage
   - Instrument with telemetry (optional, user opt-in)
   - Measure actual operation frequencies
   - Identify bottlenecks

3. Add process pooling for CLI if needed
   ```rust
   lazy_static! {
       static ref GIT_PROCESS_POOL: ThreadPool = ThreadPool::new(4);
   }
   ```

4. Document performance characteristics

#### Phase 6: Cleanup & Documentation (Week 11-12)

**Goal**: Clean architecture, clear documentation

1. Remove unused libgit2 code
2. Update CLAUDE.md with new architecture
3. Create developer guide: "When to use which backend"
4. Add troubleshooting guide for common issues

### Performance Expectations

| Operation | Current (libgit2) | Proposed (CLI) | Acceptable? |
|-----------|-------------------|----------------|-------------|
| Load 100 commits | 5ms | 20ms | ✅ (infrequent) |
| Status | 3ms | 15ms | ⚠️ (high-freq, keep libgit2) |
| Real-time diff | 2ms | 30ms | ❌ (keep libgit2) |
| Blame file | 50ms | 60ms | ✅ (1.2x is fine) |
| Fetch | 2s | 2s | ✅ (network-bound) |
| Stage file | 5ms | 15ms | ✅ (infrequent) |

### Benefits

1. **Simplified Maintenance**
   - 90% of code uses standard CLI
   - Only 4 operations use libgit2
   - Easier onboarding for contributors

2. **Behavior Consistency**
   - "Works in terminal = works in Bayon"
   - User issues easier to reproduce
   - Better alignment with AI tools

3. **Faster Feature Adoption**
   - New Git features available immediately
   - No waiting for libgit2 support

4. **Reduced Build Complexity**
   - Smaller dependency tree
   - Faster compilation
   - Easier cross-compilation

5. **Better Debugging**
   - CLI errors are more user-friendly
   - Can use `git` command to reproduce
   - Standard Git debugging tools work

### Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Performance regression on high-frequency ops | High | Keep libgit2 for status and real-time diff |
| Git not installed | High | Detect at startup, show clear error |
| Git version incompatibility | Medium | Test against Git 2.30+ (oldest supported) |
| Output parsing breaks | Medium | Strict parsing tests, version checks |
| Process overhead | Low | Add process pooling if needed |

### Alternatives Considered

#### Alternative 1: Keep 100% libgit2

**Pros**: Consistent architecture, proven performance
**Cons**: All the current maintenance burden remains
**Verdict**: ❌ Doesn't address core issues

#### Alternative 2: Switch to 100% CLI

**Pros**: Maximum simplicity
**Cons**: Unacceptable performance on status/diff
**Verdict**: ❌ Too much performance sacrifice

#### Alternative 3: Use CLI for everything, cache aggressively

**Pros**: Simple backend
**Cons**: Complex caching logic, stale data issues
**Verdict**: ❌ Complexity moved, not removed

#### Alternative 4: Hybrid (this proposal)

**Pros**: Balanced approach, clear boundaries
**Cons**: Two code paths to maintain
**Verdict**: ✅ Best trade-off

### Success Metrics

**Must Achieve** (P0):
- ✅ All E2E tests pass with hybrid backend
- ✅ No user-reported regressions vs libgit2
- ✅ Build time reduced by 20%+
- ✅ "Works in terminal = works in Bayon" for all CLI operations

**Nice to Have** (P1):
- ✅ Contributor documentation rated "clear" by 3+ new contributors
- ✅ At least 2 Git CLI-based features added in first 3 months
- ✅ Issue resolution time reduced by 30% (easier debugging)

## Rollout Plan

### Stage 1: Internal Alpha (Week 1-4)
- Feature flag `hybrid-backend` off by default
- Core team testing only
- Fix critical bugs

### Stage 2: Public Beta (Week 5-8)
- Feature flag on by default in dev builds
- Opt-in for stable users via setting
- Gather feedback, iterate

### Stage 3: General Availability (Week 9-12)
- Default for all users
- Remove `libgit2-only` mode
- Declare stable

## Open Questions

1. **Git version requirement**: Require Git 2.30+ or 2.35+?
   - Affects: Output format stability
   - Recommendation: 2.30+ (released Jan 2021, widely available)

2. **Process pooling**: Implement upfront or wait for metrics?
   - Affects: Initial implementation complexity
   - Recommendation: Wait for metrics (YAGNI)

3. **Progress reporting**: Custom vs git's native progress?
   - Affects: UX consistency
   - Recommendation: Use git's native `--progress` flag

4. **Error handling**: Parse git errors or show raw?
   - Affects: User experience
   - Recommendation: Parse common errors, fallback to raw for unknown

## References

- [git2-rs documentation](https://docs.rs/git2/)
- [Git CLI documentation](https://git-scm.com/docs)
- [VSCode Git extension architecture](https://github.com/microsoft/vscode/tree/main/extensions/git)
- [GitKraken engineering blog on Git backends](https://www.gitkraken.com/blog) (various posts)
- [Tower Git client tech choices](https://www.git-tower.com/blog/) (various posts)

## Appendix A: Code Examples

### Example: Fetch Implementation

**Before (libgit2)**:
```rust
pub fn fetch(&self, remote_name: &str) -> Result<()> {
    let repo = Repository::open(&self.repo_path)?;
    let mut remote = repo.find_remote(remote_name)?;
    
    // Complex credential callback
    let mut callbacks = RemoteCallbacks::new();
    callbacks.credentials(|_url, username_from_url, _allowed_types| {
        // SSH key? HTTPS token? Credential helper?
        // Platform-specific logic here
        Cred::ssh_key(
            username_from_url.unwrap(),
            None,
            Path::new(&format!("{}/.ssh/id_rsa", env::var("HOME")?)),
            None,
        )
    });
    
    // Progress callback
    callbacks.transfer_progress(|progress| {
        emit_progress(progress.received_objects(), progress.total_objects());
        true
    });
    
    let mut fetch_options = FetchOptions::new();
    fetch_options.remote_callbacks(callbacks);
    
    remote.fetch(&["refs/heads/*:refs/remotes/origin/*"], Some(&mut fetch_options), None)?;
    Ok(())
}
```

**After (CLI)**:
```rust
pub fn fetch(&self, remote_name: &str) -> Result<()> {
    let mut cmd = Command::new("git");
    cmd.arg("fetch")
       .arg("--progress")
       .arg(remote_name)
       .current_dir(&self.repo_path)
       .stdout(Stdio::piped())
       .stderr(Stdio::piped());
    
    let mut child = cmd.spawn()?;
    
    // Stream progress from stderr
    if let Some(stderr) = child.stderr.take() {
        let reader = BufReader::new(stderr);
        for line in reader.lines() {
            emit_progress_line(&line?);
        }
    }
    
    let status = child.wait()?;
    if !status.success() {
        return Err(format!("fetch failed: {}", status).into());
    }
    
    Ok(())
}
```

### Example: Hybrid Diff

```rust
pub fn get_diff(&self, file: &str, mode: DiffMode) -> Result<Diff> {
    match mode {
        DiffMode::RealTime => {
            // High-frequency, use libgit2
            libgit2_ops::real_time_diff(&self.repo, file)
        }
        DiffMode::Commit { oid } => {
            // Infrequent, use CLI
            cli_ops::show_commit_diff(&self.repo_path, oid, file)
        }
    }
}
```

## Appendix B: Migration Checklist

**Network Operations**:
- [ ] Fetch (with progress)
- [ ] Pull (with progress)
- [ ] Push (with progress)
- [ ] Clone (initial setup flow)
- [ ] Test SSH authentication
- [ ] Test HTTPS authentication
- [ ] Test Git Credential Manager
- [ ] Test proxy support

**Write Operations**:
- [ ] Stage files
- [ ] Unstage files
- [ ] Commit (with hooks)
- [ ] Branch create
- [ ] Branch delete
- [ ] Branch rename
- [ ] Checkout branch
- [ ] Checkout file
- [ ] Merge
- [ ] Rebase
- [ ] Cherry-pick
- [ ] Stash save
- [ ] Stash pop
- [ ] Reset
- [ ] Revert

**Query Operations**:
- [ ] Show commit
- [ ] Blame file
- [ ] Diff files
- [ ] Log search
- [ ] Grep commits

**Tests**:
- [ ] Unit tests for CLI parsing
- [ ] Integration tests for all operations
- [ ] E2E tests pass
- [ ] Performance benchmarks
- [ ] Cross-platform tests (macOS, Windows, Linux)

**Documentation**:
- [ ] Update CLAUDE.md
- [ ] Update README
- [ ] Add developer guide
- [ ] Add troubleshooting guide
- [ ] Update contribution guidelines

---

## Changelog

- **2026-09-23**: Initial proposal
