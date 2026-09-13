# AngKorGit 文档索引

> 人读这份。Agent 仍读英文 [README.md](./README.md) 和 `.cursor/skills/`。不要找 `CLAUDE.md`，那份文件不存在。

[English](./README.md)

## 文档分类

### 入门

1. **[根 README](../README-zh.md)** — 安装、命令、目录
2. **[开发](./Development-zh.md)** — 日常命令、demo 模式、Rust 引擎、AI 接入

### 质量

1. **[质量清单](./Quality-Checklist-zh.md)** — 设计 → 测试 → 提交前 → CI
2. **[测试指南](./Testing-Guide-zh.md)** — 测试金字塔：单元 vs E2E
3. **[E2E 测试](./E2E-TESTING-zh.md)** — E2E 必须打生产包，禁止对着 `dev` 跑

### 规范

1. **[编码规范](./Coding-Standards-zh.md)** — Fragment、无障碍、commit 格式

---

## Skills

Cursor 在任务匹配时加载 [`.cursor/skills/`](../.cursor/skills/)（英文原稿给模型）。人读下面这张表即可。

| Skill | 何时用 | 要点 |
| --- | --- | --- |
| **angkorgit-workflow** | 功能 / bug / PR | bun 命令、测试金字塔、husky 只管 format 不管 import |
| **angkorgit-frontend** | 改 UI / IPC | `ipc.ts` 必须同时写 demo 分支；颜色只用 token；交互元素四件套 |
| **angkorgit-engine** | 改 Rust git | command 保持薄、阻塞走 `blocking()`、冲突返回 `OpOutcome` |

新 git 操作要前后端一起改：Rust `core/` → 薄 command → `generate_handler` → `ipc.ts` + `demo.ts` → `git_engine.rs` 测试。

---

## 按任务找

### 加功能

1. workflow skill + [质量清单](./Quality-Checklist-zh.md)
2. UI 看 frontend skill；git 操作再加 engine skill
3. 先写单元测试；只有关键用户路径才加 E2E
4. 用户能看见的变化写 `CHANGELOG.md`

### 修 bug

1. [质量清单](./Quality-Checklist-zh.md) § 6：先截图。E2E「找不到元素」多半是缺 `role`，不是超时
2. 先写会失败的单元测试
3. 反复出现的坑，补一行到质量清单

### 开 PR / Review

1. 质量清单的 PR 段 + [编码规范](./Coding-Standards-zh.md)
2. 本地：`bun run format:check && bun run typecheck && bun test`

### 看懂代码

```
apps/desktop/src/          React（features/、components/、core/ipc.ts + demo.ts）
apps/desktop/src-tauri/    Tauri + git 引擎
packages/core/             纯 TS
tests/                     单元 + E2E
```

别名：`@/` → `apps/desktop/src`，`@angkorgit/core`，`@angkorgit/design-system`。

---

## 中英对照

| 中文 | 英文 |
| --- | --- |
| [README-zh.md](./README-zh.md) | [README.md](./README.md) |
| [Development-zh.md](./Development-zh.md) | [Development.md](./Development.md) |
| [Quality-Checklist-zh.md](./Quality-Checklist-zh.md) | [Quality-Checklist.md](./Quality-Checklist.md) |
| [Testing-Guide-zh.md](./Testing-Guide-zh.md) | [Testing-Guide.md](./Testing-Guide.md) |
| [E2E-TESTING-zh.md](./E2E-TESTING-zh.md) | [E2E-TESTING.md](./E2E-TESTING.md) |
| [Coding-Standards-zh.md](./Coding-Standards-zh.md) | [Coding-Standards.md](./Coding-Standards.md) |
| [TESTING_STRATEGY-zh.md](../TESTING_STRATEGY-zh.md) | [TESTING_STRATEGY.md](../TESTING_STRATEGY.md) |
| [根 README-zh.md](../README-zh.md) | [根 README.md](../README.md) |

约定：新人读 `*-zh.md`；Agent / CI / 对外仍以不带 `-zh` 的英文为准。改文档时两份一起改。

---

*更新：2026-09-13*
