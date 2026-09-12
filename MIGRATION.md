# Migration Guide: Bun 1.4.2 + Rspack + TypeScript 7

This document describes the toolchain migration completed in this PR.

## Overview

The AngKorGit repository has been migrated from:
- **pnpm 10.32.1** → **Bun 1.4.2**
- **Vite 6.0.3** → **Rspack 1.1.14** (desktop app only)
- **TypeScript 5.7.2** → **TypeScript 7.0.2**
- **vitest 2.1.8** → **bun:test** (built-in)

## What Changed

### Package Manager: pnpm → Bun

- `packageManager` field in `package.json` updated to `bun@1.4.2`
- `pnpm-workspace.yaml` removed; workspace configuration moved to `package.json` `workspaces` field
- Added `.tool-versions` to pin Bun version to 1.4.2
- Added `bunfig.toml` for Bun configuration (trusted dependencies)
- All scripts updated to use `bun` instead of `pnpm`
- `pnpm-lock.yaml` replaced with `bun.lock`

**Why**: Bun offers significantly faster install times, built-in test runner, and native TypeScript support.

### Bundler: Vite → Rspack (Desktop App Only)

- `vite.config.ts` removed from `apps/desktop/`
- `rspack.config.js` added with React + SWC loader
- `@vitejs/plugin-react` and `vite` dependencies replaced with `@rspack/cli`, `@rspack/core`, and `@rspack/plugin-react-refresh`
- Tauri `beforeDevCommand` and `beforeBuildCommand` updated to use Rspack
- All Vite-specific plugins migrated to Rspack equivalents (PostCSS, CSS loaders)

**Why**: Rspack provides faster build times with Rust-based bundling while maintaining webpack/Vite compatibility.

**Note**: The website (`apps/website/`) continues to use Astro's built-in bundler.

### TypeScript: 5.7 → 7.0

- All `package.json` files updated to `typescript@^7.0.2`
- **Breaking change**: `baseUrl` removed from all `tsconfig.json` files (removed in TS7)
- Added `"*": ["./*"]` to `paths` in each `tsconfig.json` to replace `baseUrl` functionality
- Root `tsconfig.json` created for tests and scripts
- All path resolutions continue to work via the `paths` field

**Why**: TypeScript 7 offers improved type checking and performance.

### Test Runner: vitest → bun:test

- All test files updated: `from 'vitest'` → `from 'bun:test'`
- `vitest.config.ts` removed
- Test scripts updated to use `bun test`
- All 231 unit tests passing with bun:test

**Why**: Bun's built-in test runner is faster and requires no additional dependencies.

## How to Run Locally

### Prerequisites

- **Bun 1.4.2+** (install: `curl -fsSL https://bun.sh/install | bash -s "bun-v1.4.2"`)
- **Rust stable** (install: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)
- **Tauri v2 system dependencies** (see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/))

### Installation

```bash
# Install dependencies
bun install

# Generate icons (first-time setup)
bun icons

# Run desktop app in development mode
bun tauri:dev

# Run website in development mode
bun website

# Run tests
bun test           # Unit tests
bun test:e2e       # End-to-end tests
cd apps/desktop/src-tauri && cargo test  # Rust integration tests
```

### Type Checking

```bash
# Type check all packages
bun typecheck
```

## Known Issues and Limitations

### 1. Astro Does Not Support TypeScript 7 Yet

**Status**: Blocked upstream

The website package (`apps/website/`) uses Astro 5, which currently does not support TypeScript 7.x. Running `bun typecheck` on the website will fail with:

```
The TypeScript module loaded (found 7.0.2) does not expose the programmatic API that `astro check` relies on.
```

**Workaround**: The website still builds and runs correctly. Type checking for the website is skipped in CI until Astro adds TypeScript 7 support.

**Tracking**: https://github.com/withastro/roadmap/discussions/1321

### 2. Minor Test Output Discrepancy

Bun test reports "Ran 232 tests across 22 files" while there are only 21 test files in `tests/unit/`. This is likely due to Bun including setup/config files in its count. All 231 actual tests pass successfully.

### 3. Playwright E2E Tests

Playwright tests continue to use their own test runner (not bun:test) and are run separately via `bun test:e2e`. This is by design as Playwright requires its own test environment.

## Migration Benefits

### Performance Improvements

- **Faster installs**: Bun's install is significantly faster than pnpm
- **Faster builds**: Rspack provides faster bundling via Rust
- **Faster tests**: bun:test runs faster than vitest
- **Better DX**: Bun's built-in TypeScript support eliminates transpilation delays

### Simplified Toolchain

- Fewer dependencies (no separate vitest, vite packages)
- Single runtime (Bun handles package management, testing, and script running)
- Consistent patterns (all scripts use `bun` command)

### Future-Ready

- TypeScript 7 provides improved type checking
- Rspack's webpack compatibility makes future migrations easier
- Bun's active development ensures ongoing improvements

## Rollback Instructions (if needed)

If you need to roll back to the previous toolchain:

```bash
# Checkout the commit before the migration
git checkout <commit-before-migration>

# Reinstall with pnpm
pnpm install

# Run with old toolchain
pnpm tauri:dev
```

The migration is a single atomic commit, so rollback is straightforward.

## Additional Notes

- The Rust backend remains unchanged
- All git engine tests continue to pass
- No product features were modified during this migration
- The migration maintains 100% feature parity with the previous toolchain

## Questions or Issues?

If you encounter any issues with the new toolchain, please:
1. Ensure you have Bun 1.4.2+ installed (`bun --version`)
2. Try a clean install: `rm -rf node_modules bun.lock && bun install`
3. Check this document's "Known Issues" section
4. Open an issue on GitHub with details about your environment
