# AngKorGit Documentation Hub

[中文](./README-zh.md)

> **For AI assistants**: Start with [Skills](#skills), then the docs in this folder. Do not look for `CLAUDE.md` — agent playbooks live in `.cursor/skills/`. Human readers who prefer Chinese: use `*-zh.md` (index: [README-zh.md](./README-zh.md)).

## 📚 Document Categories

### 🚀 Getting Started

1. **[../README.md](../README.md)** — Install, commands, repo layout
2. **[Development](./Development.md)** — Daily workflow, demo mode, Rust engine, AI providers

### ✅ Quality Assurance

1. **[Quality Checklist](./Quality-Checklist.md)** ⭐ — Design → test → pre-PR → CI
2. **[Testing Guide](./Testing-Guide.md)** ⭐ — Test pyramid, unit vs E2E
3. **[E2E Testing](./E2E-TESTING.md)** — E2E must hit a production build, not `dev`

### 📖 Standards

1. **[Coding Standards](./Coding-Standards.md)** — Fragment, a11y, commit messages

---

## Skills

Agent playbooks in [`.cursor/skills/`](../.cursor/skills/). Cursor loads them when the task matches.

| Skill | When | Path |
| --- | --- | --- |
| **angkorgit-workflow** | Feature, bug, PR, quality gates, toolchain | [SKILL.md](../.cursor/skills/angkorgit-workflow/SKILL.md) |
| **angkorgit-frontend** | React, `ipc.ts` / `demo.ts`, tokens, a11y | [SKILL.md](../.cursor/skills/angkorgit-frontend/SKILL.md) |
| **angkorgit-engine** | `src-tauri`, libgit2, `commands.rs`, `git_engine.rs` | [SKILL.md](../.cursor/skills/angkorgit-engine/SKILL.md) |

New git operation: follow **frontend** + **engine** (Rust `core/` → thin command → `generate_handler` → `ipc.ts` + `demo.ts` → `git_engine.rs` test).

---

## 🎯 Quick Navigation by Task

### Add a feature

1. [angkorgit-workflow](../.cursor/skills/angkorgit-workflow/SKILL.md) + [Quality Checklist](./Quality-Checklist.md)
2. UI? [angkorgit-frontend](../.cursor/skills/angkorgit-frontend/SKILL.md). Git op? also [angkorgit-engine](../.cursor/skills/angkorgit-engine/SKILL.md)
3. Unit test first ([Testing Guide](./Testing-Guide.md)); E2E only for a critical user journey
4. User-facing? `CHANGELOG.md`

### Fix a bug

1. [Quality Checklist](./Quality-Checklist.md) § 6 — screenshot, then root cause (usually missing `role`, not timeout)
2. Failing unit test first
3. Recurring pattern → add a line to Quality Checklist

### Review / PR

1. [Quality Checklist](./Quality-Checklist.md) PR section
2. [Coding Standards](./Coding-Standards.md)
3. Local CI: `bun run format:check && bun run typecheck && bun test`

### Understand the codebase

1. [Development](./Development.md) + [../README.md](../README.md)
2. Skills above for the layer you are in
3. Grep — layout is `apps/desktop/src/` (React), `apps/desktop/src-tauri/` (engine), `packages/core/` (pure TS)

---

## 📋 Document Metadata

| Document | Type | Audience | AI Priority |
|----------|------|----------|-------------|
| [.cursor/skills/](../.cursor/skills/) | Playbook | AI | ⭐⭐⭐ Primary |
| [Quality-Checklist.md](./Quality-Checklist.md) | Process | Developers | ⭐⭐ High |
| [Testing-Guide.md](./Testing-Guide.md) | Reference | Developers | ⭐⭐ High |
| [E2E-TESTING.md](./E2E-TESTING.md) | Guide | Developers | ⭐⭐ High |
| [Development.md](./Development.md) | Guide | Developers | ⭐ Medium |
| [Coding-Standards.md](./Coding-Standards.md) | Reference | Developers | ⭐ Medium |
| [../README.md](../README.md) | Overview | All | ⭐ Medium |
| [../TESTING_STRATEGY.md](../TESTING_STRATEGY.md) | Overview | Developers | Medium |
| [README-zh.md](./README-zh.md) | 中文索引 | 人 | — |

---

## 🤖 AI Assistant Guidelines

**Code change**: matching skill → Quality Checklist design phase → tests per Testing Guide → Coding Standards.

**Bug**: Quality Checklist § 6 + Testing Guide debugging. Do not bump E2E timeouts.

**Git engine**: [angkorgit-engine](../.cursor/skills/angkorgit-engine/SKILL.md). **UI / IPC**: [angkorgit-frontend](../.cursor/skills/angkorgit-frontend/SKILL.md). **Commands**: Development.md (package manager is **bun**, not pnpm).

```
.cursor/skills/          (agent playbooks)
    ↓
docs/Quality-Checklist.md
    └─→ Testing-Guide.md + E2E-TESTING.md
docs/Development.md
docs/Coding-Standards.md
```

**By path**:
- `apps/desktop/src/` → angkorgit-frontend
- `apps/desktop/src-tauri/` → angkorgit-engine
- `packages/core/` → unit-test in `tests/unit/`; types stay in sync with Rust serde camelCase
- `tests/` → Testing-Guide.md

---

## 📝 Contributing to Docs

1. Add a purpose line at the top of a new doc.
2. Link it from this README (category + metadata table).
3. Add a `*-zh.md` sibling for humans (Chinese). Keep both in sync. Link `[中文]` / `[English]` at the top.
4. Cross-link related docs. Do not invent files that are not in the repo.

---

## 🔄 Maintenance

- After a production issue: Quality-Checklist.md
- After a workflow change: the matching `.cursor/skills/*/SKILL.md`
- Before a PR: `bun run format:check` (husky format-only does not match CI import order)

---

*Last Updated: 2026-09-13*
