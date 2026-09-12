# AngKorGit

A modern, fast Git client built with Tauri and React.

## Install

```bash
bun install
```

## Development

```bash
# Run desktop app
bun tauri:dev

# Run in browser (demo mode)
bun dev

# Build desktop app
bun tauri:build
```

## Testing

```bash
# Type checking
bun typecheck

# Unit tests
bun test

# E2E tests
bun test:e2e

# Rust tests
cd apps/desktop/src-tauri && cargo test
```

**📚 Testing Documentation:**
- [Testing Strategy](./TESTING_STRATEGY.md) - Overview of test structure
- [E2E Testing Guide](./docs/E2E-TESTING.md) - Critical setup and troubleshooting

## Tech Stack

- **Frontend**: React 18, TypeScript 7, Rspack 2
- **Desktop**: Tauri v2
- **Git Engine**: Rust + libgit2
- **Testing**: bun:test, Playwright
- **Package Manager**: Bun 1.4.2

## Repository Structure

```
apps/
  desktop/          - Desktop application
packages/
  core/            - Shared types and logic
  design-system/   - UI components and tokens
tests/
  unit/            - Unit tests
  e2e/             - E2E tests
```

## License

MIT
