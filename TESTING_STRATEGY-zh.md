# 测试策略

[English](./TESTING_STRATEGY.md)

两层就够：

- **E2E 冒烟**（`tests/e2e/smoke.test.ts`）：关键路径，慢
- **单元测试**（`tests/unit/`，`bun:test`）：纯逻辑、工具函数，快

原则：**能下沉的下沉**。属性、结构、算法放单元；只有真用户旅程才上 E2E。

## E2E 冒烟在测什么

当前 smoke 覆盖启动进仓库、选 commit 看详情、冲突解决等关键路径。其余（主题、命令面板搜索、过滤）单元测试更合适。

具体条目以 `tests/e2e/smoke.test.ts` 为准，不要抄过时数字。

## 为什么能这么干

没有 Tauri 时，`ipc.ts` 自动走 `demo.ts`：合成仓库（约 400 commit、分支、冲突样例）。所以：

- 单元测试可以带着真实 UI 数据结构跑，不必起浏览器
- E2E 只负责「浏览器里几块拼起来还能用」

## 怎么跑

```bash
bun test          # 单元，常跑
bun test:e2e      # E2E，提交前；必须对着生产包
```

E2E **禁止**打 `bun run dev`（Rspack lazy compilation 会在 CI 404）。详见 [E2E-TESTING-zh.md](./docs/E2E-TESTING-zh.md)。

## 新功能加测试

1. 业务逻辑 / 算法 → 单元测试
2. 才考虑 E2E，仅当：需要真浏览器 API，或跨组件状态现有 smoke 盖不住，或 mock IPC 测不了
3. 多数功能不需要新 E2E
