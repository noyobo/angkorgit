# 测试指南

[English](./Testing-Guide.md)

---
- **用途**：单元 / E2E / 集成怎么选、怎么写、怎么查
- **相关**：[质量清单](./Quality-Checklist-zh.md)、[Skills](./README-zh.md#skills)
- **哲学**：**能下沉的下沉**
---

单元测试跑 **`bun:test`**（`import { describe, expect, it } from 'bun:test'`），不是 Vitest。E2E 是 rstest + Playwright。数字以仓库里实际测试文件为准。

## 金字塔与决策

```
能用单元测吗？
├─ 能 → 写单元测试
└─ 不能 → 是用户路径吗？
         ├─ 是 → 写 E2E
         └─ 不是 → 再想想要不要测
```

- **单元**（`tests/unit/*.test.ts`）：纯函数、数据结构、a11y 属性、组件结构、边界。快、报错准。
- **E2E**（`tests/e2e/smoke.test.ts`）：关键用户旅程。慢、脆。禁止测实现细节、样式、边角（边角下沉到单元）。
- **Rust**（`apps/desktop/src-tauri/tests/git_engine.rs`）：每个新引擎函数，真临时仓库。

不要测：第三方库内部、简单 getter、生成代码、demo 数据生成器。

## 1. 单元测试

测属性存在，用读源码的方式（见 `tests/unit/accessibility.test.ts`），比 E2E 快一个数量级，还能精确定位缺了哪一行。

```bash
bun test
bun test --watch
bun test tests/unit/accessibility.test.ts
```

测：纯函数、变换、类型结构、ARIA、接口、空/单/最大/缺数据。

不测：私有实现、第三方、JSX 渲染（除非查结构）。

## 2. E2E

选择器用 `getByRole` / `getByLabel` / 可见文本，不要 CSS class、不要 `nth-child`。

公共操作抽 helper（例如 `rightClickWorkingCopyFile`）。失败要有截图。每条测试独立、不共享状态。

```bash
bun run test:e2e
```

**必须打生产包再测**，见 [E2E-TESTING-zh.md](./E2E-TESTING-zh.md)。对着 `bun run dev` 本机可能过、CI 必挂。

超时了：截图 → `page.pause()` → 看有没有 `role`。不要加 timeout。

## 3. Demo 模式

`ipc.ts`：`isTauri()` 为假时走 `demo.ts` 合成数据。`bun run dev` 和 Playwright 都走这条。

新 IPC 必须两条腿：真实 `invoke('rust_fn', …)` + `demoXxx()`。漏 demo，浏览器和 E2E 会直接炸。

## 4. 目录

```
tests/unit/*.test.ts     bun:test
tests/e2e/smoke.test.ts  关键路径
```

单元：`describe('模块')` + `it('在某某情况下做什么')`。E2E：现在时、用户视角（`opens blame view from file menu`）。

## 5. 覆盖目标

业务逻辑行覆盖尽量高；E2E 覆盖关键路径 100%；引擎函数尽量都有集成测试。**不追求 100% 行覆盖。**

## 6. 挂了怎么查

单元：`bun test --grep "某条名字"`。常见原因：文件挪了、组件重构、断言过时。

E2E：`test-results/` 截图 → 必要时 headed → `page.pause()`。常见原因：缺 `role`、没渲染、偶发时序（少）、重复节点。

## 7. CI

先单元（fail-fast），build 完再 E2E，Rust 三平台并行。本地 push 前至少 `bun test && bun run typecheck`；动过 UI 路径再加 E2E。

## 8. 维护

行为变了才改测试。CSS class 改名、文件搬家但接口没变，不必为了实现细节改 E2E。红测试不要合。功能删了测试一起删。一条测试一个逻辑断言。

## 9. 什么时候不要写测试

还在原型、代码是生成的、测试比代码还复杂、行为是平凡 getter。目标是信心，不是覆盖率数字。
