# Feature Implementation Workflow

## Standard Process (Execute, Don't Explain)

### 1. Branch & PR Management
```bash
git checkout -b cursor/<feature-name>-b130
# Implement feature...
git add -A && git commit -m "feat: ..."
git push -u origin cursor/<feature-name>-b130
# Create draft PR → Add ci label when ready
```

### 2. Code Change Order
1. **Core Logic** → Data structures / state management
2. **UI Components** → Interface implementation
3. **Integration** → Connect parts together
4. **Styling** → CSS / design tokens
5. **Unit Tests** → Cover core logic
6. **Format** → `bun biome check --write .`
7. **Type Check** → `bun run typecheck`

### 3. Component Abstraction Decision

**Extract to design-system when:**
- Pure UI, no business logic
- Decoupled via props
- Reusable across apps

**Keep in apps when:**
- Business-specific
- Coupled to state management
- Single-app usage only

### 4. Testing Strategy

**Design-system components:**
- Type safety tests
- Props interface tests
- Integration coverage (via consumers)

**Business logic:**
- Full unit tests
- Mock external dependencies
- Edge cases

**Don't test:**
- Simple UI layouts
- Third-party wrappers
- Demo/temporary code

### 5. Commit Conventions

```
feat: new feature
fix: bug fix
refactor: refactoring
test: tests
style: formatting/styling
chore: build/tooling
```

**One logical change per commit. No batching.**

### 6. Common Patterns

#### Multi-tab Management
```typescript
// 1. Data structure
Map<repoPath, Map<tabId, Tab>>

// 2. CRUD operations
addTab(), removeTab(), getTab(), getTabs()

// 3. UI component
<TabStrip items={...} activeId={...} />
```

#### Focus Management
```typescript
// 1. Track focus
useEffect(() => {
  panel.addEventListener('focusin', ...);
  panel.setAttribute('data-xxx-focused', 'true');
});

// 2. Focus-gated shortcuts
if (!isFocused()) return;
```

#### State Persistence
```typescript
// react-resizable-panels
<Group id="xxx-v3" autoSave="xxx-v3">
```

### 7. Output Checklist

- [ ] TypeScript type check passes
- [ ] Biome format passes
- [ ] Unit tests pass (core logic)
- [ ] Integration tests pass (if applicable)
- [ ] Design tokens only (no hex colors)
- [ ] Conventional Commits
- [ ] PR created as draft
- [ ] CI label (when ready)

---

## This Task Example

**Task**: Terminal panel enhancements (#45)

**Execution**:
1. ✅ Branch: `cursor/terminal-panel-enhancements-b130`
2. ✅ Implementation: Multi-tab, focus control, persistence, styling
3. ✅ Fix: Shortcut conflicts
4. ✅ Tests: 15 session tests + 11 TabStrip tests
5. ✅ Refactor: Extract TabStrip to design-system
6. ✅ PR: #46 (draft → ci label)

**Commits**: 7 commits, each independent logic
**Tests**: 257 pass (26 new)
**Duration**: ~1 hour

---

**For similar tasks: Execute directly without repeated explanations.**
