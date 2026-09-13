# Testing Strategy

[中文](./TESTING_STRATEGY-zh.md)

## Final Implementation

We've consolidated our test suite into an efficient two-tier approach:

- **3 Essential E2E Smoke Tests** (~9 seconds): Critical path verification  
- **231 Unit Tests** (~171ms): Pure logic, utilities, and algorithms

This structure provides comprehensive coverage with minimal execution time.

## Test Distribution

### E2E Smoke Tests (`tests/e2e/smoke.test.ts`)

Three critical integration paths:

1. **App launch and repository opening** - Verifies the complete bootstrap flow from welcome screen to loaded commit graph
2. **Commit selection and inspector** - Tests the main interaction pattern (select commit → view files)
3. **Conflict resolution workflow** - Validates the most complex UI interaction in the app

**Why only 3?** These tests verify that:
- The application builds and starts correctly
- Core navigation and state management works
- The most complex interactive feature (conflicts) functions end-to-end

Everything else is better tested at the unit level.

### Unit Tests (`tests/unit/`)

231 tests covering:

- **Core algorithms** (158 tests)
  - Graph layout and lane assignment
  - Word-level diff computation
  - Conflict marker parsing
  - File filtering and search
  - AI text segment parsing
  - Commit message formatting
  - Remote URL parsing
  - Worktree path suggestions

- **Business logic** (73 tests)
  - Stage/unstage operations
  - Branch management
  - Merge/rebase workflows
  - Stash operations
  - SSH key resolution
  - Account management
  - Signing configuration

## Performance Comparison

| Metric | Before (27 E2E) | After (3 E2E + 231 Unit) |
|--------|----------------|--------------------------|
| **Total test time** | ~39s | ~9s + 171ms = 9.2s |
| **E2E coverage** | All features | Critical paths only |
| **Reliability** | Required timeout tuning | Deterministic |
| **Debug speed** | Screenshot/logs | Direct stack traces |
| **CI caching** | Browser install overhead | Native dependencies only |

## Why This Works

The application's **demo mode** (`src/core/demo.ts`) provides comprehensive mock data:
- 400 commits with realistic graph structure
- Branches, tags, stashes
- Conflicted files
- Complete Git operation mocks via `src/core/ipc.ts`

When tests run without Tauri, the app automatically uses demo mode. This means:
- Unit tests can render the full UI with realistic data
- No need for browser overhead when testing deterministic logic
- E2E tests focus solely on integration and browser-specific behaviors

## Migration Rationale

The original 27 E2E tests were migrated as follows:

**Deleted** (covered by existing unit tests):
- Theme switching → Pure UI state, already tested via unit tests
- Command palette search → String filtering, unit tested
- Commit search/filtering → Graph algorithm, unit tested  
- Branch switching → State management, unit tested
- File list interactions → Component behavior, unit tested

**Consolidated** into 3 smoke tests:
- Multiple "app opens" variants → Single comprehensive launch test
- Multiple inspector variants → Single selection test
- Multiple conflict resolver tests → Single pick-and-resolve test

**Result**: Test coverage remains comprehensive, but execution time dropped 77% with improved reliability.

## Running Tests

```bash
# Unit tests (fast, run frequently)
bun test

# E2E smoke tests (slower, run before commits)
bun test:e2e

# CI runs both
bun test && bun test:e2e
```

### Important: E2E Test Configuration

⚠️ **E2E tests run against production builds, not dev server.**

This is critical because Rspack's lazy compilation in dev mode causes:
- JavaScript chunks failing to load (404 errors)
- MIME type errors in CI environments
- Test timeouts

**See [`docs/E2E-TESTING.md`](./docs/E2E-TESTING.md) for complete details.**

CI configuration:
```yaml
# Build production artifacts first
bun run build

# Serve static files (not dev server)
cd apps/desktop/dist
python3 -m http.server 1420
```

## Future Additions

When adding new features:

1. **Write unit tests** for all business logic and algorithms
2. **Consider E2E** only if the feature:
   - Requires real browser APIs (clipboard, drag-and-drop outside app)
   - Has complex cross-component state flows not covered by existing smoke tests
   - Cannot be adequately tested with mocked Tauri commands

Most features will not need E2E tests.
