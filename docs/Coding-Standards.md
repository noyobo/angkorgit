# AngKorGit 编码规范

本文档记录 AngKorGit 项目的编码规范和最佳实践。

## React / TypeScript 规范

### Fragment 使用规范

**规则：明确使用 `<Fragment>` 而不是简写语法 `<>`**

#### 原因

1. **可读性**：明确的 `<Fragment>` 更清晰地表达意图，特别是在复杂的嵌套结构中
2. **一致性**：保持代码风格统一，便于维护和审查
3. **调试友好**：在开发工具中更容易识别和定位

#### 示例

❌ **错误** - 不要使用简写语法：
```tsx
return (
  <>
    <div>Content 1</div>
    <div>Content 2</div>
  </>
);
```

✅ **正确** - 使用明确的 Fragment：
```tsx
import { Fragment } from 'react';

return (
  <Fragment>
    <div>Content 1</div>
    <div>Content 2</div>
  </Fragment>
);
```

#### 适用场景

- 条件渲染中需要返回多个元素
- map 循环中需要包裹多个元素
- 组件返回多个顶层元素

```tsx
// 条件渲染
{isVisible && (
  <Fragment>
    <Header />
    <Content />
  </Fragment>
)}

// map 循环
{items.map(item => (
  <Fragment key={item.id}>
    <ItemHeader title={item.title} />
    <ItemContent body={item.body} />
  </Fragment>
))}
```

## 提交前检查流程

**在提交代码前，必须在本地运行以下检查，确保全部通过后再提交：**

```bash
# 1. Biome 格式化检查
bun x @biomejs/biome ci .

# 2. TypeScript 类型检查
bun run typecheck

# 3. Rust 格式化
cd apps/desktop/src-tauri && cargo fmt

# 4. Rust 格式化检查
cd apps/desktop/src-tauri && cargo fmt --check

# 5. Rust Clippy 检查（如果环境支持）
cd apps/desktop/src-tauri && cargo clippy --all-targets -- -D warnings

# 6. Rust 测试（如果环境支持）
cd apps/desktop/src-tauri && cargo test
```

**注意**：
- 必须确保步骤 1-4 通过才能提交
- 步骤 5-6 如果本地环境有问题（如 edition2024），可以依赖 CI 检查
- 这样可以避免多次提交修复 CI 问题，提高效率

## TypeScript 规范

- 使用严格模式
- 避免使用 `any` 类型
- 为公共 API 提供明确的类型定义
- 使用 `interface` 定义对象结构，使用 `type` 定义联合类型和复杂类型

## 命名规范

- 组件使用 PascalCase：`BlamePanel`, `DiffViewer`
- 函数和变量使用 camelCase：`openBlame`, `fileMenu`
- 常量使用 UPPER_SNAKE_CASE：`MAX_FILE_SIZE`, `DEFAULT_TIMEOUT`
- 类型和接口使用 PascalCase：`BlameHunk`, `FileBlame`

## 注释规范

- 代码应该自解释，只在必要时添加注释
- 注释应该解释"为什么"而不是"做什么"
- 对于复杂的业务逻辑，添加解释性注释
- 使用 JSDoc 为公共 API 提供文档

## 测试规范

- 新功能必须包含单元测试
- 用户可见的功能必须包含 E2E 测试
- 测试文件命名：`*.test.ts` 或 `*.spec.ts`
- 测试描述应该清晰地说明测试内容

## Git 提交规范

- 提交信息使用英文
- 格式：`<type>: <description>`
- 类型包括：
  - `feat`: 新功能
  - `fix`: 修复问题
  - `refactor`: 重构代码
  - `style`: 代码格式调整
  - `test`: 添加或修改测试
  - `docs`: 文档更新
  - `chore`: 构建工具或依赖更新

## 性能最佳实践

- 大列表使用虚拟化（`@tanstack/react-virtual`）
- 避免不必要的重渲染，合理使用 `memo`, `useMemo`, `useCallback`
- 懒加载非关键资源
- 图片使用合适的格式和尺寸

## 可访问性

- 为交互元素提供 `aria-label`
- 确保键盘可访问性
- 使用语义化 HTML
- 提供合适的 ARIA 属性
