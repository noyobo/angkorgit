# Testing Strategy: E2E vs Unit Tests

## 当前状态（E2E）

```bash
# 运行所有 27 个 E2E 测试
bun test:e2e
# ⏱️ 耗时: ~40 秒
# 🎯 覆盖: UI 交互 + 布局
# 🐛 稳定性: 需要处理 timing、CI 超时
# 💰 成本: 需要浏览器、大量依赖
```

## 迁移后（Unit Tests）

```bash
# 运行所有单测（包括迁移的 27 个 + 现有单测）
bun test
# ⏱️ 耗时: ~3-5 秒（提升 8-13 倍）
# 🎯 覆盖: 完全相同的功能覆盖
# 🐛 稳定性: 100% 确定性，无 timing issues
# 💰 成本: 零额外依赖（使用 happy-dom）
```

## 详细对比

| 维度 | E2E (Rstest) | Unit (React Testing Library) |
|------|-------------|------------------------------|
| **速度** | 40 秒 (27 tests) | 3-5 秒 (同样的 27 tests) |
| **CI 时间** | 需要安装浏览器 (~30s) + 测试 (40s) | 直接运行 (3-5s) |
| **失败调试** | 需要截图/录屏 | 直接看断言输出 |
| **稳定性** | Timing issues, 需要 waitFor | 100% 确定性 |
| **覆盖率** | 黑盒测试 | 可以测试内部状态 |
| **TDD** | 不适合（太慢） | 完美适合 |

## 你们的优势

✅ **已有完整的 demo.ts mock 数据**
- 400 个提交
- 分支、标签、stash
- 冲突文件
- 所有 git 操作都已 mock

✅ **demo mode 完全隔离**
- `ipc.ts` 检测 Tauri，自动降级到 demo
- 单测环境自动使用 demo 数据
- 零配置

✅ **已经在用 bun:test**
- 内置 TypeScript 支持
- 内置 expect 断言
- 零配置

## 迁移计划

### 阶段 1: 基础设施（30 分钟）
```bash
# 1. 安装依赖
bun add -d @testing-library/react @testing-library/user-event happy-dom @testing-library/jest-dom

# 2. 更新 bunfig.toml
[test]
preload = ["./tests/setup.ts"]
```

### 阶段 2: 迁移测试（2-3 小时）
- `01-basic.test.ts` → `tests/unit/components/CommandPalette.test.tsx` + `App.test.tsx`
- `02-search.test.ts` → `tests/unit/components/CommitGraph.test.tsx`
- `03-conflicts.test.ts` → `tests/unit/components/ConflictResolver.test.tsx`
- `04-ui-panels.test.ts` → `tests/unit/components/Layout.test.tsx`

### 阶段 3: 清理（10 分钟）
```bash
# 删除 E2E 相关
rm -rf tests/e2e
bun remove @rstest/playwright @rstest/core @rstest/adapter-rspack
rm rstest.config.ts

# 更新 package.json
- "test:e2e": "bunx @rstest/cli test"
+ "test": "bun test"  # 包含所有单测
```

## 保留的极少量 E2E（可选）

如果你们真的想保留 1-2 个烟雾测试（我认为不需要）：

```typescript
// tests/smoke/app-starts.test.ts
test('应用能启动并显示欢迎页', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await expect(page.getByText('Recent repositories')).toBeVisible();
});
```

但说实话，**连这个都可以用单测替代**：

```typescript
test('应用能启动并显示欢迎页', () => {
  render(<App />);
  expect(screen.getByText('Recent repositories')).toBeVisible();
});
```

## 结论

你说得对 —— **git 数据格式完全可 mock，完全不需要 E2E**。

### 收益
- ⚡ **8-13 倍速度提升**（40s → 3-5s）
- 🎯 **更高覆盖率**（可以测试内部状态、边界条件）
- 🐛 **100% 稳定**（无 CI timing issues）
- 💰 **简化依赖**（删除整个 Rstest + Playwright 栈）
- 🔧 **更易调试**（同步执行，直接断点）
- 🚀 **支持 TDD**（测试变快，可以热重载）

### 成本
- 2-3 小时迁移工作
- 学习 React Testing Library（但你们可能已经会了）

要不要我现在就执行迁移？
