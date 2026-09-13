# AngKorGit 编码规范

[English](./Coding-Standards.md)

## Git Hooks

**husky + lint-staged**：`bun install` 之后会自动装 hook，只格式化暂存文件。

注意：lint-staged 现在跑的是 `biome format --write`，**不会整理 import 顺序**。CI 跑的是 `biome ci .`（会查 import）。提交前请再跑 `bun run format:check`。详见 [质量清单](./Quality-Checklist-zh.md) § 3。

## React / TypeScript

### 必须用显式 `<Fragment>`，禁止 `<>`

可读、风格统一、DevTools 更好找。

```tsx
import { Fragment } from 'react';

return (
  <Fragment>
    <div>Content 1</div>
    <div>Content 2</div>
  </Fragment>
);
```

条件渲染、`map` 里包多个节点、组件返回多个根节点，都用 `<Fragment>`。`map` 时把 `key` 放 Fragment 上。

## 提交前本地检查

```bash
bun x @biomejs/biome ci .
bun run typecheck
cd apps/desktop/src-tauri && cargo fmt
cd apps/desktop/src-tauri && cargo fmt --check
cd apps/desktop/src-tauri && cargo clippy --all-targets -- -D warnings
cd apps/desktop/src-tauri && cargo test
```

1–4 提交前必须过。5–6 本机环境不行（例如 edition2024）可以交给 CI。

## TypeScript

- 开 strict
- 不要无故 `any`
- 对外 API 写清楚类型
- 对象结构用 `interface`，联合/复杂类型用 `type`

## 命名

| 种类 | 风格 | 例子 |
| --- | --- | --- |
| 组件 | PascalCase | `BlamePanel` |
| 函数 / 变量 | camelCase | `openBlame` |
| 常量 | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| 类型 | PascalCase | `FileBlame` |

## 注释

能靠代码说清就别写。写就写 **为什么**，不写「是什么」。公开 API 用 JSDoc。

## 测试

- 新功能要有单元测试（`tests/unit/*.test.ts`，`bun:test`）
- 用户关键路径才加 E2E
- 测试名说清楚在测什么行为

## Commit

英文。`<type>: <description>`

`feat` / `fix` / `refactor` / `style` / `test` / `docs` / `chore`

## 性能

大列表用 `@tanstack/react-virtual`（`VirtualDiff`、commit graph 已有先例）。少不必要的重渲染。非关键资源懒加载。

## 无障碍

可交互元素要有 `aria-label`、键盘可达、语义化 HTML、合适的 ARIA。完整四件套见 [质量清单](./Quality-Checklist-zh.md) § 1。
