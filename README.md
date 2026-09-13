# AngKorGit

A modern, fast Git client built with Tauri and React.

[中文](./README-zh.md)

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

**📚 Docs:** [docs/README.md](./docs/README.md) ([中文](./docs/README-zh.md)) · [Testing Strategy](./TESTING_STRATEGY.md) · [E2E Testing](./docs/E2E-TESTING.md)

## Skills

Agent playbooks in [`.cursor/skills/`](./.cursor/skills/). Loaded when the task matches.

| Skill | When |
| --- | --- |
| [angkorgit-workflow](./.cursor/skills/angkorgit-workflow/SKILL.md) | Feature, bug, PR, quality gates |
| [angkorgit-frontend](./.cursor/skills/angkorgit-frontend/SKILL.md) | React, IPC / demo mode, tokens, a11y |
| [angkorgit-engine](./.cursor/skills/angkorgit-engine/SKILL.md) | Rust git engine, Tauri commands, `git_engine.rs` |

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
