# 质量清单

[English](./Quality-Checklist.md)

---
- **用途**：从线上问题总结出来的质量门禁
- **读者**：所有开发者（开 PR 必看）
- **相关**：[测试指南](./Testing-Guide-zh.md)、[开发](./Development-zh.md)、[Skills](./README-zh.md#skills)
- **教训来源**：Blame 功能 E2E 失败、CI import 顺序
---

## 速查

| 阶段 | 关注 | 工具 |
| --- | --- | --- |
| 设计 | 无障碍 | 心里过一遍 |
| 实现 | 先写单元测试 | `bun:test` |
| 提交前 | 格式 + import | Biome |
| 开 PR 前 | 本地跑一遍 CI | 脚本 |
| Review | 清单勾完 | GitHub |

---

## 1. 设计：无障碍不是事后补丁

每个可交互元素都要：

```tsx
<div
  role="button"
  tabIndex={0}
  aria-label="Clear all"
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
```

**为什么**：E2E 用 `getByRole('button')`。没有 `role`，测试会莫名超时「找不到元素」。

清单：

- [ ] 有 `role`
- [ ] 键盘能到（`tabIndex`、`onKeyDown`）
- [ ] 读屏友好（`aria-label` / `aria-describedby`）
- [ ] 焦点可见（`:focus-visible`）

---

## 2. 测试金字塔

黄金法则：**能下沉的下沉**。

| 类型 | 用来测 | 例子 |
| --- | --- | --- |
| 单元 | 属性、结构、纯逻辑 | `expect(content).toContain('role="button"')` |
| E2E | 关键用户路径 | 打开仓库 → 看 graph → 解决冲突 |

数字以 `tests/` 里实际文件为准，文档里的 13 / 158 会过时。

新功能：在 `tests/unit/{feature}.test.ts` 检查 a11y 属性存在、菜单不要重复、空/单条/最大/缺数据。E2E 用 `getByRole`，不要用 CSS class。测行为，不测实现。

---

## 3. 提交前

当前 husky 只跑 `biome format --write`，**不会整理 import**。CI 跑 `biome ci .`，会查 type import 是否在前。本地过、CI 挂，就是这个坑。

提交前：

- [ ] `bun run format:check`（= `biome ci .`）
- [ ] import 顺序过了
- [ ] 改动重新 `git add`

---

## 4. 开 PR 前（本地模拟 CI）

```bash
bun run format:check
bun run typecheck
bun test
bun run build
bun run test:e2e

# 动过 Rust 再加：
cd apps/desktop/src-tauri
cargo fmt --check
cargo clippy --all-targets -- -D warnings
cargo test
```

本地 5 分钟，好过 CI 失败干等 30 分钟。

- [ ] 上面都过
- [ ] 新逻辑有单元测试
- [ ] 用户路径变了才改 E2E
- [ ] 文档：README / CHANGELOG / 工作流变了就改 skill
- [ ] 没有 `console.log` / `debugger`
- [ ] UI 改动准备了截图（深浅色）

---

## 5. PR 本身

先 grep 确认宣传的功能真的在代码里。文档勾：`CHANGELOG.md`、skill、README。自己看一眼 `git diff`：没有冲突标记、没有无用 import、没有无故 `any`。

无障碍 / 测试 / 合并前清单见 `.github/PULL_REQUEST_TEMPLATE.md`。

---

## 6. E2E 超时怎么查

**错**：加 timeout、瞎 `wait`、重试。

**对**：

1. `await page.screenshot({ path: 'debug.png' })` 看实际画面
2. `await page.pause()` 打开 inspector
3. `getByRole('button')` 失败 → 看 HTML 有没有 `role="button"`
4. 超时 99% 是缺属性，不是时序。修 `role`，不要修 `waitFor`

| 现象 | 根因 | 修法 |
| --- | --- | --- |
| Element not found | 缺 `role` | 补上 |
| Resolved to 2 elements | 组件重复 | 收到共享组件 |
| CI 挂、本地过 | hook 比 CI 松 | hook ⊇ CI |
| Import 顺序 | format ≠ check | `biome check --organize-imports` |

---

## 7. CI

PR 要打 `ci` 标签才会跑。阶段：Format → Typecheck → Test → Build → E2E → Rust。`fail-fast`。测试挂了就修，不要靠重试。

---

## 8. 合入后

E2E 有没有抓到单元漏的？合入后有没有 bug（哪道门没拦住）？CI 耗时？教训写回本文件；工作流变了改对应 skill。

---

## 五条血泪

1. **无障碍不是可选项** — 缺 `role` 导致 E2E 超时。预防：单元测试断言属性存在。
2. **金字塔要守** — a11y 放单元（<1s、报错准），E2E 只留用户路径。
3. **本地检查 ⊇ CI** — format 不管 import，check 管。
4. **先截图再猜** — 超时信息几乎没用。
5. **代码现状 ≠ git 史** — 标「没做」之前先 grep。

完美 PR：设计就有 a11y、逻辑有单元、关键路径有 E2E、本地 CI 过、文档数字对、UI 有截图。前面多 30 分钟，后面少排两小时。
