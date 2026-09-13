# Quality Checklist

[中文](./Quality-Checklist-zh.md)

---
**Document Metadata**
- **Purpose**: Systematic quality gates learned from production issues
- **Audience**: All developers (required reading for PRs)
- **Type**: Process checklist
- **Priority**: ⭐⭐ High (AI: read for all code changes)
- **Related Docs**: [Testing Guide](./Testing-Guide.md), [Development](./Development.md), [Skills](./README.md#skills)
- **Last Updated**: 2026-09-13
- **Lessons From**: Blame feature E2E test failures, CI import order issues
---

> **Purpose**: Systematic quality gates learned from production issues. Follow these to ship reliable features faster.

## 📋 Quick Reference

| Stage | Focus | Tool |
|-------|-------|------|
| **Design** | Accessibility | Mental checklist |
| **Implementation** | Unit tests first | Vitest |
| **Pre-commit** | Format + imports | Biome |
| **Pre-PR** | Local CI checks | Scripts |
| **PR Review** | Checklist completion | GitHub |

---

## 1. 🎨 Design Phase

### Accessibility First (not an afterthought)

Every interactive element needs:

```tsx
// ✅ Complete accessibility
<div
  role="button"           // Semantic role for screen readers
  tabIndex={0}            // Keyboard reachable (Tab key)
  aria-label="Clear all"  // Screen reader description
  onClick={handleClick}
  onKeyDown={(e) => {     // Keyboard support
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
```

**Why**: E2E tests use `getByRole('button')` — without proper roles, tests fail mysteriously with "element not found" timeouts.

**Checklist**:
- [ ] Interactive elements have `role` attribute
- [ ] Keyboard navigation works (`tabIndex`, `onKeyDown`)
- [ ] Screen reader friendly (`aria-label`, `aria-describedby`)
- [ ] Focus visible (`:focus-visible` styles)

---

## 2. 🧪 Testing Strategy (Test Pyramid)

### Golden Rule: **能下沉的下沉** (Push tests down the pyramid)

```
         /\     ← E2E Tests (slow, brittle)
        /  \      13 tests, ~43s
       /____\     Focus: User flows only
      /      \    
     / Unit   \   ← Unit Tests (fast, precise)
    /  Tests   \    5 tests, <1s
   /____________\   Focus: Logic, structure, accessibility
```

### When to write what

| Test Type | Use For | Example |
|-----------|---------|---------|
| **Unit** | Attributes, structure, pure logic | `expect(content).toContain('role="button"')` |
| **Integration** | Component interaction | Multiple components working together |
| **E2E** | Critical user flows | Login → Browse → Purchase |

### Unit Test Checklist (new features)

Create `tests/unit/{feature}.test.ts`:

- [ ] **Accessibility attributes exist**
  ```typescript
  expect(component).toContain('role="button"');
  expect(component).toContain('tabIndex={0}');
  expect(component).toContain('aria-label');
  ```

- [ ] **No duplicate functionality**
  ```typescript
  // Check if a menu item appears only once
  const matches = component.match(/MenuItem.*Blame/g);
  expect(matches?.length).toBe(1);
  ```

- [ ] **Edge cases covered**
  - Empty states
  - Single item
  - Maximum items
  - Missing data

### E2E Test Checklist

- [ ] Tests actual user flows, not implementation details
- [ ] Uses semantic selectors (`getByRole`, `getByLabel`)
- [ ] Has meaningful test names describing user action
- [ ] Screenshots on failure enabled
- [ ] Each test is independent (no shared state)

**Anti-pattern**:
```typescript
// ❌ Testing implementation
await page.locator('.css-class-xyz').click();

// ✅ Testing behavior
await page.getByRole('button', { name: 'Submit' }).click();
```

---

## 3. 🔧 Pre-Commit Phase

### Current Issue ⚠️

The pre-commit hook runs `biome format --write` which does **not** organize imports. This caused CI failures where type imports were out of order.

### Required Fix

Update `.git/hooks/pre-commit`:

```bash
#!/bin/bash
echo "🔍 Running pre-commit checks..."

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$' || true)

if [ -n "$STAGED_FILES" ]; then
  echo "📝 Checking TypeScript files..."
  
  # Run full biome check (includes format + organize imports + lint)
  echo "$STAGED_FILES" | xargs bunx @biomejs/biome check --write --organize-imports-enabled=true --unsafe
  
  # Re-add modified files
  echo "$STAGED_FILES" | xargs git add
fi

echo "✅ Pre-commit checks passed"
exit 0
```

**Why `--organize-imports-enabled=true`**:
- Type imports must come before regular imports
- Biome's `format` command doesn't sort imports
- CI runs `biome ci .` which **does** check import order
- Local commit bypassed this → surprise CI failure

### Pre-Commit Checklist

- [ ] Format applied (`biome format`)
- [ ] Imports organized (`organizeImports: true`)
- [ ] Lint rules pass (`biome check`)
- [ ] Changes re-staged (`git add`)

---

## 4. 🚀 Pre-PR Phase

### Local CI Simulation

Run the **exact checks CI will run**:

```bash
# Frontend checks
bun run format:check          # biome ci .
bun run typecheck             # All packages
bun run test                  # Unit tests
bun run build                 # Production build
bun run test:e2e              # E2E tests

# Rust checks (if applicable)
cd apps/desktop/src-tauri
cargo fmt --check
cargo clippy --all-targets -- -D warnings
cargo test
```

**Time investment**: 5 minutes locally > 30 minutes waiting for CI to fail

### Pre-PR Checklist

- [ ] All local CI checks pass
- [ ] New features have unit tests
- [ ] E2E tests updated (if user flows changed)
- [ ] Documentation updated (README, CHANGELOG, skills if workflow changed)
- [ ] No debug code left (`console.log`, `debugger`)
- [ ] Screenshots prepared (for UI changes)

---

## 5. 📝 PR Checklist

### Before Creating PR

1. **Verify implementation completeness**
   ```bash
   # Check if advertised features actually exist
   grep -r "CommandPalette" apps/desktop/src/
   grep -r "openBlame" apps/desktop/src/features/ui/
   ```

2. **Update documentation**
   - [ ] CHANGELOG.md (user-facing changes)
   - [ ] `.cursor/skills/` (architecture/conventions)
   - [ ] README.md (if setup changed)
   - [ ] Test counts in PR description match reality

3. **Self-review**
   - [ ] No unintended file changes (check `git diff`)
   - [ ] No merge conflict markers left
   - [ ] Imports are clean (no unused)
   - [ ] Types are proper (no `any` without justification)

### PR Template Additions

The PR template checklist should include:

```markdown
## Accessibility (for UI changes)
- [ ] Interactive elements have proper ARIA roles
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus management is correct
- [ ] Works with screen readers (tested or reviewed)

## Testing
- [ ] Unit tests cover new logic and edge cases
- [ ] E2E tests cover critical user paths (not implementation)
- [ ] Tests use semantic selectors (getByRole, not getByTestId)
- [ ] All tests pass locally: `bun test && bun run test:e2e`

## Pre-merge
- [ ] Ran full local CI checks (see Quality-Checklist.md)
- [ ] Documentation updated (CHANGELOG, README, skills if workflow changed)
- [ ] Test counts in PR description match actual test files
- [ ] Screenshots attached (for UI changes, both themes)
```

---

## 6. 🐛 Debugging Strategies

### When E2E Tests Timeout

**Wrong approach** ❌:
- Increase timeout
- Add random waits
- Retry logic

**Right approach** ✅:
1. **Screenshot/video** — See what's actually rendered
   ```typescript
   await page.screenshot({ path: 'debug.png' });
   ```

2. **Check element actually exists**
   ```typescript
   await page.pause(); // Opens inspector
   ```

3. **Verify selector matches intention**
   ```typescript
   // If getByRole('button') fails → check if element has role="button"
   const html = await page.content();
   console.log(html); // Does it have the attribute?
   ```

4. **Root cause analysis**
   - 99% of timeouts are missing attributes, not timing
   - Fix the root cause (add `role`), not the symptom (add `waitFor`)

### Common Issues → Solutions

| Symptom | Root Cause | Solution |
|---------|------------|----------|
| "Element not found" | Missing `role` attribute | Add `role="button"` etc. |
| "Resolved to 2 elements" | Duplicate components | Consolidate into shared component |
| "CI fails, local passes" | Pre-commit incomplete | Update hook to match CI checks |
| "Import order error" | Format ≠ Check | Use `biome check --organize-imports` |

---

## 7. 🔄 CI Optimization

### Current Setup

```yaml
# .github/workflows/ci.yml
- Only runs when PR has 'ci' label
- Stages: Format → Typecheck → Test → Build → E2E → Rust
- fail-fast: true (cancel on first failure)
- Path filters (only test what changed)
```

### CI Checklist

- [ ] PR has `ci` label to trigger checks
- [ ] All stages pass before requesting review
- [ ] No flaky tests (if test fails, fix it, don't retry)
- [ ] If adding expensive checks, consider path filters

---

## 8. 📊 Post-Merge Review

After a feature ships, review:

### Metrics
- [ ] Did E2E tests catch issues unit tests missed? (Consider rebalancing pyramid)
- [ ] Were there post-merge bugs? (What gate failed?)
- [ ] How long did CI take? (Optimization opportunities?)

### Documentation
- [ ] Test counts updated in docs
- [ ] Lessons learned added to this file
- [ ] Matching skill updated (if applicable)

---

## 📚 Related Documents

- [Testing Guide](./Testing-Guide.md) — Detailed testing strategies
- [Development](./Development.md) — Setup and workflow
- [Coding Standards](./Coding-Standards.md) — Code style and patterns
- [Skills](./README.md#skills) — Agent playbooks

---

## 🎓 Key Lessons (from Production Issues)

### Lesson 1: Accessibility is not optional
- **Issue**: E2E tests timed out because `getByRole('button')` couldn't find elements
- **Root cause**: Missing `role="button"` attribute on interactive `<div>` elements
- **Fix**: Added proper ARIA roles, keyboard support, labels
- **Prevention**: Unit tests now verify accessibility attributes exist

### Lesson 2: Test pyramid must be strictly followed
- **Issue**: All accessibility checks were in E2E layer (43 seconds, vague errors)
- **Solution**: Moved to unit tests (<1 second, precise errors)
- **Rule**: Unit tests for structure/attributes, E2E for user flows only

### Lesson 3: Pre-commit must match CI
- **Issue**: CI failed on import order, but local commit succeeded
- **Root cause**: Pre-commit ran `format`, CI ran `check` (includes import sorting)
- **Fix**: Update pre-commit to run `biome check --organize-imports-enabled=true`
- **Rule**: Local checks ⊇ CI checks (never <)

### Lesson 4: Visual debugging > blind guessing
- **Issue**: Timeout errors gave no clue what was wrong
- **Solution**: Screenshots revealed elements existed but lacked accessibility attributes
- **Rule**: When E2E fails, screenshot first, theorize second

### Lesson 5: Upstream ≠ current state
- **Issue**: Marked CommandPalette as "deferred" when it was actually implemented
- **Solution**: Grep codebase to verify before marking incomplete
- **Rule**: Verify implementation reality, don't assume from git history

---

## 🎯 Summary: The Perfect PR

A perfect PR:
1. ✅ Designed with accessibility from the start
2. ✅ Has unit tests for logic and structure
3. ✅ Has E2E tests for critical user flows only
4. ✅ Passes all local CI checks before pushing
5. ✅ Pre-commit hook fixed formatting and imports
6. ✅ Documentation and test counts are accurate
7. ✅ Screenshots included for UI changes
8. ✅ PR checklist fully completed

**Time investment**: +30 minutes upfront → -2 hours debugging later
