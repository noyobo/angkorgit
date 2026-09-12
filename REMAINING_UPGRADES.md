# 剩余可升级依赖

## 概述
经过前面的升级工作，大部分依赖已更新到最新稳定版本。以下是剩余可升级的依赖及其风险评估。

---

## 🔴 主要版本升级（Breaking Changes）

### 1. TailwindCSS v3 → v4
**当前版本**: `3.4.19`  
**最新版本**: `4.3.3`  
**影响范围**: 全局样式系统  
**风险等级**: **高** ⚠️

**Breaking Changes (TailwindCSS v4)**:
- 新的配置文件格式（CSS-based configuration）
- PostCSS 插件架构重构
- 部分实用类名变更
- 可能需要重写 `tailwind.config.ts`

**影响的文件**:
- `packages/design-system/tailwind.config.ts`
- `apps/desktop/tailwind.config.ts`
- 所有使用 Tailwind 类的组件

**建议**: 
- 作为独立 PR 处理
- 需要全面的 UI 回归测试
- 参考官方迁移指南: https://tailwindcss.com/docs/upgrade-guide

---

### 2. tailwind-merge v2 → v3
**当前版本**: `2.6.1` (design-system)  
**最新版本**: `3.6.0`  
**影响范围**: `packages/design-system/src/lib/cn.ts`  
**风险等级**: **中** 🟡

**Breaking Changes**:
- API 可能有变化
- 与 TailwindCSS v4 的兼容性

**建议**: 
- 与 TailwindCSS v4 一起升级
- 测试所有使用 `cn()` 工具函数的组件

---

## 🟢 次要版本不一致（内部）

### 3. lucide-react 版本不一致
**design-system**: `0.577.0`  
**desktop**: `1.45.0`  

**问题**: 
- `packages/design-system` 未同步升级到 v1
- 可能导致图标渲染不一致

**修复**: 
```bash
cd packages/design-system
bun add lucide-react@^1.45.0
```

**风险等级**: **低** ✅  
**建议**: 立即修复以保持一致性

---

## ✅ 已完全更新的依赖

以下依赖已更新到最新版本，无需进一步操作：

| 依赖 | 当前版本 | 最新版本 | 状态 |
|------|----------|----------|------|
| `react` | 19.3.0 | 19.3.0 | ✅ 最新 |
| `react-dom` | 19.3.0 | 19.3.0 | ✅ 最新 |
| `typescript` | 7.0.2 | 7.0.2 | ✅ 最新 |
| `@playwright/test` | 1.63.0 | 1.63.0 | ✅ 最新 |
| `@rspack/cli` | 2.2.3 | 2.2.3 | ✅ 最新 |
| `@rspack/core` | 2.2.3 | 2.2.3 | ✅ 最新 |
| `@tauri-apps/cli` | 2.11.4 | 2.11.4 | ✅ 最新 |
| `framer-motion` | 13.2.0 | 13.2.0 | ✅ 最新 |
| `react-router-dom` | 7.18.3 | 7.18.3 | ✅ 最新 |
| `react-resizable-panels` | 4.12.4 | 4.12.4 | ✅ 最新 |
| `zustand` | 5.0.15 | 5.0.15 | ✅ 最新 |
| `cmdk` | 1.1.1 | 1.1.1 | ✅ 最新 |
| `highlight.js` | 11.12.0 | 11.12.0 | ✅ 最新 |
| `sonner` | 2.0.8 | 2.0.8 | ✅ 最新 |
| `@xterm/xterm` | 6.0.0 | 6.0.0 | ✅ 最新 |
| `@tanstack/react-virtual` | 3.14.12 | 3.14.12 | ✅ 最新 |
| All Radix UI components | Latest | Latest | ✅ 最新 |

---

## 📋 建议的升级顺序

### 立即修复 (本 PR)
1. ✅ **lucide-react 版本统一** - 低风险，快速修复

### 后续独立 PR
2. 🔴 **TailwindCSS v4 + tailwind-merge v3** - 高风险，需要专门的 PR 和充分测试

---

## 总结

**当前状态**:
- ✅ 核心依赖（React 19, TypeScript 7, Rspack 2, Tauri 2）已全部更新到最新
- ✅ 大部分 UI 库和工具已更新到最新稳定版本
- 🟡 仅剩 TailwindCSS v4 作为重大升级项

**建议**:
1. 先修复 `lucide-react` 版本不一致（本 PR 或快速 hotfix）
2. TailwindCSS v4 升级作为单独的 PR，需要：
   - 详细的迁移计划
   - 完整的 UI 回归测试
   - 可能需要多次迭代

**完成度**: 约 95% 的依赖已升级到最新版本 🎉
