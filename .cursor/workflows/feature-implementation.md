# Feature Implementation Workflow

## 标准流程（执行，少说话）

### 1. 分支 & PR 管理
```bash
git checkout -b cursor/<feature-name>-b130
# 实现功能...
git add -A && git commit -m "feat: ..."
git push -u origin cursor/<feature-name>-b130
# 创建 draft PR → 添加 ci label（准备好时）
```

### 2. 代码变更顺序
1. **核心逻辑** → 数据结构/状态管理
2. **UI 组件** → 界面实现
3. **集成** → 连接各部分
4. **样式调整** → CSS/设计令牌
5. **单元测试** → 覆盖核心逻辑
6. **格式化** → `bun biome check --write .`
7. **类型检查** → `bun run typecheck`

### 3. 组件抽象决策

**何时提取到 design-system:**
- 纯 UI，无业务逻辑
- 可通过 props 解耦
- 其他应用可复用

**何时保留在 apps:**
- 业务特定
- 状态管理耦合
- 仅此应用使用

### 4. 测试策略

**Design-system 组件:**
- 类型安全测试
- Props 接口测试
- 集成测试覆盖（通过使用方）

**业务逻辑:**
- 完整单元测试
- Mock 外部依赖
- 边界情况

**不测试:**
- 简单的 UI 布局
- 第三方库封装
- Demo/临时代码

### 5. Commit 规范

```
feat: 新功能
fix: 修复 bug
refactor: 重构
test: 测试
style: 格式化/样式
chore: 构建/工具
```

**每个逻辑变更一个 commit，不批量。**

### 6. 常见模式

#### 多标签管理
```typescript
// 1. 数据结构
Map<repoPath, Map<tabId, Tab>>

// 2. CRUD 操作
addTab(), removeTab(), getTab(), getTabs()

// 3. UI 组件
<TabStrip items={...} activeId={...} />
```

#### 焦点管理
```typescript
// 1. 跟踪焦点
useEffect(() => {
  panel.addEventListener('focusin', ...);
  panel.setAttribute('data-xxx-focused', 'true');
});

// 2. 焦点门控快捷键
if (!isFocused()) return;
```

#### 状态持久化
```typescript
// react-resizable-panels
<Group id="xxx-v3" autoSave="xxx-v3">
```

### 7. 输出检查清单

- [ ] TypeScript 类型检查通过
- [ ] Biome 格式化通过
- [ ] 单元测试通过（核心逻辑）
- [ ] 集成测试通过（如适用）
- [ ] 设计令牌（无 hex 颜色）
- [ ] Conventional Commits
- [ ] PR 创建为 draft
- [ ] CI label（准备好时）

---

## 本次实践示例

**任务**: Terminal panel enhancements (#45)

**执行**:
1. ✅ 分支: `cursor/terminal-panel-enhancements-b130`
2. ✅ 实现: 多标签、焦点控制、持久化、样式
3. ✅ 修复: 快捷键冲突
4. ✅ 测试: 15 个 session 测试 + 11 个 TabStrip 测试
5. ✅ 重构: 提取 TabStrip 到 design-system
6. ✅ PR: #46 (draft → ci label)

**Commits**: 7 个，每个独立逻辑
**测试**: 257 pass (26 new)
**用时**: ~1 小时

---

**后续类似任务: 执行即可，不要重复解释每一步。**
