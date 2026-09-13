# AngKorGit

用 Tauri 和 React 做的现代、快速 Git 客户端。

[English](./README.md)

## 安装

```bash
bun install
```

## 开发

```bash
# 桌面应用
bun tauri:dev

# 浏览器（demo 模式，假仓库数据）
bun dev

# 打包桌面应用
bun tauri:build
```

## 测试

```bash
bun typecheck
bun test                                          # 单元测试
bun test:e2e                                      # E2E（必须打生产包再测）
cd apps/desktop/src-tauri && cargo test           # Rust git 引擎
```

**文档：** [中文索引](./docs/README-zh.md) · [英文索引](./docs/README.md) · [测试策略](./TESTING_STRATEGY-zh.md) · [E2E](./docs/E2E-TESTING-zh.md)

## Skills

给 Cursor Agent 的操作手册，在 [`.cursor/skills/`](./.cursor/skills/)（英文，给模型读）。任务匹配时自动加载。人读中文说明见 [docs/README-zh.md](./docs/README-zh.md#skills)。

| Skill | 何时用 |
| --- | --- |
| [angkorgit-workflow](./.cursor/skills/angkorgit-workflow/SKILL.md) | 做功能、修 bug、开 PR、质量门禁 |
| [angkorgit-frontend](./.cursor/skills/angkorgit-frontend/SKILL.md) | React、IPC / demo、token、无障碍 |
| [angkorgit-engine](./.cursor/skills/angkorgit-engine/SKILL.md) | Rust git 引擎、Tauri command、`git_engine.rs` |

## 技术栈

- **前端**：React 18、TypeScript 7、Rspack 2
- **桌面**：Tauri v2
- **Git 引擎**：Rust + libgit2
- **测试**：bun:test、Playwright（经 rstest）
- **包管理**：Bun 1.4.2（不是 pnpm）

## 仓库结构

```
apps/desktop/       桌面应用（React + Tauri）
packages/core/      纯 TS 领域逻辑（类型、图谱、forge、AI）
packages/design-system/  设计 token，组件里禁止写 hex
tests/unit/         单元测试
tests/e2e/          E2E 冒烟
```

## License

MIT
