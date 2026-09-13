# 开发指南

[English](./Development.md)

快捷链接：[质量清单](./Quality-Checklist-zh.md) · [测试指南](./Testing-Guide-zh.md) · [编码规范](./Coding-Standards-zh.md) · [Skills](./README-zh.md#skills)

> 命令以根目录 `package.json` 为准：**bun**，不是 pnpm。英文版里的 pnpm / Vitest 已过时。

## 环境

- Node 20+，包管理器 **bun**（`packageManager` 已钉死版本）
- [rustup](https://rustup.rs) 的稳定版 Rust
- Tauri v2 系统依赖见 [官方列表](https://v2.tauri.app/start/prerequisites/)：
  - **macOS**：Xcode Command Line Tools
  - **Linux**：`libwebkit2gtk-4.1-dev` 等
  - **Windows**：WebView2 + MSVC

## 日常命令

| 命令 | 做什么 |
| --- | --- |
| `bun install` | 装依赖 |
| `bun icons` | 生成占位图标（第一次 `tauri:dev` 前跑一次） |
| `bun tauri:dev` | 完整桌面应用（前端 + Rust，两边热更新） |
| `bun dev` | 只跑前端，浏览器里用 **demo 假数据** |
| `bun typecheck` | 全仓库 TypeScript |
| `bun test` / `bun test --watch` | 单元测试（`bun:test`，不是 Vitest） |
| `bun test:e2e` | E2E（rstest + Playwright，要对着生产包） |
| `cd apps/desktop/src-tauri && cargo test` | git 引擎集成测试（真临时仓库） |
| `bun tauri:build` | 生产包（.dmg / .msi / .deb / .AppImage） |
| `bun release:mac` | 打包并打开 .dmg 所在目录 |
| `bun install:mac` | 拷到 `/Applications` 并启动 |

## Demo 模式

`apps/desktop/src/core/ipc.ts` 用 `isTauri()` 判断是否在桌面里。浏览器里每一条 IPC 都由 `demo.ts` 回答：一份确定的合成仓库（约 400 commit、分支、合并、脏工作区、冲突样例）。**做 UI 用这个**；CI 的 Playwright 也走这条路。

## 改 Rust 引擎

代码在 `apps/desktop/src-tauri/src/core/`，一个领域一个模块。

- `commands.rs` 保持薄：解析参数、调 `core::*`、返回 serde 类型
- 所有会堵线程的 IO 走 `blocking()`（内部是 `spawn_blocking`）
- 可能把仓库停在半截的操作（merge / rebase / cherry-pick）返回 `OpOutcome`，`status: "conflicts"`，**不要当 error 扔**
- 每个新引擎函数在 `tests/git_engine.rs` 加集成测试

完整步骤见 skill `angkorgit-engine`。

## 加 AI 供应商

1. 在 `packages/core/src/ai/providers.ts` 写适配器（大约一个函数）
2. 登记到 `createAiProvider` 和 `AI_PROVIDER_PRESETS`
3. 设置页、能力、传输会自动接上

本机 CLI 智能体（Claude Code、Codex、Gemini CLI、OpenCode）走另一条：`packages/core/src/ai/cliAgents.ts` 的 argv/stdin，以及 `apps/desktop/src-tauri/src/ai_cli.rs` 的二进制白名单。

## 发版

打 `v*` tag 并 push：`.github/workflows/release.yml` 用 `tauri-action` 打 macOS 通用包、Windows、Linux，挂到 GitHub draft release。
