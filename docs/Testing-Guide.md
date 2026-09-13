# Testing Guide

---
**Document Metadata**
- **Purpose**: Comprehensive testing reference for unit, E2E, and integration tests
- **Audience**: All developers
- **Type**: Technical reference
- **Priority**: ⭐⭐ High (AI: read for testing questions)
- **Related Docs**: [Quality Checklist](./Quality-Checklist.md), [CLAUDE.md](../CLAUDE.md) § 8
- **Last Updated**: 2026-09-13
- **Philosophy**: 能下沉的下沉 (Push tests down the pyramid)
---

> **Philosophy**: 能下沉的下沉 (Push tests down the pyramid)

## Test Pyramid

```
         /\
        /  \      E2E Tests
       / 13 \     • Slow (~43s total)
      /______\    • Brittle (browser, timing)
     /        \   • Expensive to maintain
    /  Integ-  \  
   /  ration    \ Integration Tests
  /      5       \• Medium speed
 /______________\ • Moderate cost
/                \
/   Unit Tests    \ Unit Tests  
/       158        \• Fast (<1s)
/                   \• Precise errors
/____________________\• Cheap to maintain
```

## Decision Tree: Which Test Type?

```
Can I test this with a unit test?
├─ YES → Write unit test ✅
└─ NO  → Is it a user flow?
         ├─ YES → Write E2E test ✅
         └─ NO  → Reconsider: do you need a test?
```

## 1. Unit Tests

**Location**: `tests/unit/*.test.ts`

**Runner**: Vitest

**Speed**: <1 second for entire suite

### What to Unit Test

✅ **DO test**:
- Pure functions
- Data transformations
- Type definitions (structure checks)
- Accessibility attributes
- Component interfaces
- Edge cases and boundaries

❌ **DON'T test**:
- Implementation details (private methods)
- Third-party libraries
- Simple getters/setters
- JSX rendering (unless checking structure)

### Examples

#### Testing Accessibility Attributes

```typescript
// tests/unit/accessibility.test.ts
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

describe('Accessibility - Interactive elements', () => {
  const fileRowPath = './apps/desktop/src/features/commit/WorkingCopyPanel.tsx';
  
  it('FileRow has proper ARIA attributes', () => {
    const content = fs.readFileSync(fileRowPath, 'utf8');
    
    // Verify accessibility attributes exist in source
    expect(content).toContain('role="button"');
    expect(content).toContain('tabIndex={0}');
    expect(content).toContain('aria-label');
    expect(content).toContain('onKeyDown');
  });
  
  it('FileRow handles keyboard events', () => {
    const content = fs.readFileSync(fileRowPath, 'utf8');
    
    // Verify keyboard support
    expect(content).toMatch(/e\.key === ['"]Enter['"]/);
    expect(content).toMatch(/e\.key === ['" ] ['"]/);
  });
});
```

**Why**: These tests caught the "Menu did not open" E2E failures in <1s with precise errors.

#### Testing Data Transformations

```typescript
// tests/unit/graphLayout.test.ts
import { describe, expect, it } from 'vitest';
import { GraphLayout } from '@angkorgit/core';

describe('GraphLayout', () => {
  it('assigns lanes to linear history', () => {
    const commits = [
      { oid: 'a', parents: ['b'] },
      { oid: 'b', parents: ['c'] },
      { oid: 'c', parents: [] },
    ];
    
    const layout = new GraphLayout();
    layout.append(commits);
    
    expect(layout.lanes).toEqual([
      { commit: 'a', lane: 0 },
      { commit: 'b', lane: 0 },
      { commit: 'c', lane: 0 },
    ]);
  });
  
  it('handles merge commits', () => {
    const commits = [
      { oid: 'merge', parents: ['a', 'b'] },
      { oid: 'a', parents: ['base'] },
      { oid: 'b', parents: ['base'] },
      { oid: 'base', parents: [] },
    ];
    
    const layout = new GraphLayout();
    layout.append(commits);
    
    // Merge commit on lane 0, branches on lanes 1 and 2
    expect(layout.lanes[0]).toEqual({ commit: 'merge', lane: 0 });
    expect(layout.lanes[1].lane).toBeGreaterThan(0);
    expect(layout.lanes[2].lane).toBeGreaterThan(0);
  });
});
```

#### Testing Component Structure

```typescript
// tests/unit/components.test.ts
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

describe('Component Structure', () => {
  it('FileActionsMenu does not duplicate Blame menu item', () => {
    const menuPath = './apps/desktop/src/features/file-actions/FileActionsMenu.tsx';
    const workingCopyPath = './apps/desktop/src/features/commit/WorkingCopyPanel.tsx';
    
    const menu = fs.readFileSync(menuPath, 'utf8');
    const workingCopy = fs.readFileSync(workingCopyPath, 'utf8');
    
    // Menu should have Blame
    expect(menu).toContain('Blame');
    
    // WorkingCopy should NOT duplicate it
    const workingCopyBlameMatches = workingCopy.match(/DropdownMenuItem.*Blame/g);
    expect(workingCopyBlameMatches).toBeNull(); // or check it only uses FileActionsMenu
  });
});
```

### Running Unit Tests

```bash
# Run all unit tests
bun test

# Watch mode (auto-rerun on change)
bun test --watch

# Run specific test file
bun test tests/unit/accessibility.test.ts

# Coverage report
bun test --coverage
```

---

## 2. E2E Tests

**Location**: `tests/e2e/*.test.ts`

**Runner**: Playwright + rstest

**Speed**: ~3-4 seconds per test

### What to E2E Test

✅ **DO test**:
- Critical user journeys
- Multi-step workflows
- Integration between major features
- Happy paths that users depend on

❌ **DON'T test**:
- Every possible interaction
- Edge cases (unit tests)
- Styling and layout
- Implementation details

### The 13 E2E Tests

Current coverage (from `smoke.test.ts`):

1. **opens repository and displays commit graph**
2. **selects commit and shows file details**
3. **resolves conflict by picking side**
4. **opens blame view from working copy file menu**
5. **opens blame at specific commit from commit details**
6. **closes blame view with Escape key**
7. **displays blame hunks with author and commit info**
8. **clicks hunk to navigate to commit in graph**
9. **opens blame from diff panel toolbar button**
10. **right-click hunk menu provides copy actions**
11. **switches between working copy and specific commit blame**
12. **DEBUG: screenshot menu interaction**
13. **opens file history from blame panel**

### E2E Best Practices

#### Use Semantic Selectors

```typescript
// ❌ BAD: Brittle, implementation-coupled
await page.locator('.css-xyz-123').click();
await page.locator('div > button:nth-child(3)').click();

// ✅ GOOD: Semantic, user-centric
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByLabel('Email address').fill('user@example.com');
await page.getByText('Welcome back').isVisible();
```

#### Helper Functions for Common Actions

```typescript
// Helper: Right-click a working copy file
async function rightClickWorkingCopyFile(page: Page) {
  const ipcFile = page.locator('text=ipc.ts').first();
  const fileRow = ipcFile.locator('..').locator('..').first();
  await fileRow.scrollIntoViewIfNeeded();
  await fileRow.click({ button: 'right' });
}

// Usage in multiple tests
test('opens blame from file menu', async ({ page }) => {
  await page.goto('http://localhost:1420/');
  await page.waitForLoadState('networkidle');
  
  await rightClickWorkingCopyFile(page);
  await page.getByRole('menuitem', { name: /Blame/ }).click();
  
  await expect(page.getByText(/Blame:/)).toBeVisible();
});
```

**Why helpers?**:
- Reduces duplication
- Single source of truth for interactions
- Easier to update when UI changes

#### Screenshots on Failure

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
});
```

#### Debugging E2E Tests

```typescript
// Pause and open inspector
await page.pause();

// Take screenshot
await page.screenshot({ path: 'debug.png' });

// Log page content
console.log(await page.content());

// Check if element exists (without waiting)
const exists = await page.getByRole('button').count() > 0;

// Run single test
bun run test:e2e --grep "opens blame view"
```

### Running E2E Tests

```bash
# Run all E2E tests
bun run test:e2e

# Run with UI (headed mode)
bun run test:e2e --ui

# Run specific test
bun run test:e2e --grep "opens blame"

# Debug mode (pauses before each action)
bun run test:e2e --debug

# Generate report
bunx playwright show-report
```

---

## 3. Demo Mode

**Location**: `apps/desktop/src/core/demo.ts`

**Purpose**: Run frontend in browser without Rust backend

### When to Use Demo Mode

- ✅ E2E tests (no Git engine needed)
- ✅ Frontend development (`bun run dev`)
- ✅ Quick UI testing
- ❌ Integration tests (need real Git)

### Anatomy of Demo Mode

```typescript
// core/ipc.ts
export async function fileBlame(file: string, rev: string | null): Promise<FileBlame> {
  if (isDemoMode()) {
    return demoFileBlame(file, rev);  // ← Synthetic data
  }
  return invoke('file_blame', { file, rev });  // ← Real Rust command
}

// core/demo.ts
export function demoFileBlame(file: string, rev?: string | null): FileBlame {
  const isWorkingCopy = !rev;
  
  return {
    path: file,
    rev: rev || null,
    lines: [/* 50 synthetic lines */],
    hunks: [
      {
        startLine: 1,
        lineCount: 20,
        commit: { oid: 'abc123', author: 'Alice', ... },
      },
      // ... more hunks
    ],
  };
}
```

### Adding Demo Mode Support

When adding a new IPC command:

1. **Add real implementation**:
   ```typescript
   // ipc.ts
   export async function myCommand(input: string): Promise<Output> {
     if (isDemoMode()) {
       return demoMyCommand(input);
     }
     return invoke('my_command', { input });
   }
   ```

2. **Add demo implementation**:
   ```typescript
   // demo.ts
   export function demoMyCommand(input: string): Output {
     // Return realistic synthetic data
     return {
       result: `Demo result for ${input}`,
       items: [
         { id: 1, name: 'Demo Item 1' },
         { id: 2, name: 'Demo Item 2' },
       ],
     };
   }
   ```

3. **E2E tests automatically use demo mode** when running `bun run dev`

---

## 4. Test Organization

### File Structure

```
tests/
├── unit/
│   ├── accessibility.test.ts       # ARIA attributes, keyboard support
│   ├── graphLayout.test.ts         # Graph lane assignment logic
│   ├── wordDiff.test.ts            # Word-level diff algorithm
│   ├── conflicts.test.ts           # Conflict marker parsing
│   ├── ai*.test.ts                 # AI provider adapters
│   ├── forge.test.ts               # Forge integrations
│   └── ...
├── e2e/
│   ├── smoke.test.ts               # Critical user paths (13 tests)
│   └── playwright.config.ts        # E2E configuration
└── integration/                     # (Future: component integration tests)
```

### Naming Conventions

#### Unit Tests

```typescript
describe('Feature or Module', () => {
  it('does something in this specific case', () => {
    // Arrange
    const input = setupInput();
    
    // Act
    const result = doSomething(input);
    
    // Assert
    expect(result).toBe(expected);
  });
});
```

#### E2E Tests

```typescript
// Use present tense, user perspective
test('opens blame view from file menu', async ({ page }) => {
  // Steps...
});

test('navigates to commit from blame hunk click', async ({ page }) => {
  // Steps...
});
```

---

## 5. Coverage Goals

### Current Coverage

| Type | Count | Speed | Focus |
|------|-------|-------|-------|
| Unit | 158 tests | <1s | Logic, structure |
| E2E | 13 tests | ~43s | User flows |
| Rust | 73 tests | ~10s | Git engine |

### Target Coverage

- **Unit**: 80%+ line coverage on business logic
- **E2E**: 100% of critical user paths
- **Rust**: 90%+ of engine functions

**NOT aiming for**: 100% coverage (diminishing returns)

### What NOT to Test

- Third-party library internals
- Trivial getters/setters
- Generated code
- Mock/demo data generators
- Constants and enums

---

## 6. Debugging Failed Tests

### Unit Test Failures

```bash
# Run with verbose output
bun test --reporter=verbose

# Run single test file
bun test tests/unit/accessibility.test.ts

# Inspect specific test
bun test --grep "FileRow has proper ARIA"
```

**Common causes**:
- File path changed → Update test
- Component refactored → Update assertion
- New attribute added → Update expectation

### E2E Test Failures

**Step 1: Look at screenshots/videos**
```bash
# Screenshots saved to test-results/
ls test-results/**/*.png
```

**Step 2: Run in headed mode**
```bash
bun run test:e2e --headed
```

**Step 3: Use debugger**
```typescript
await page.pause(); // Opens Playwright inspector
```

**Common causes**:
- Missing `role` attribute → Add accessibility attributes
- Element not visible → Check rendering logic
- Timing issue (rare) → Add `waitForLoadState`
- Duplicate elements → Remove duplication

---

## 7. CI Integration

### Local Pre-Push Checks

```bash
#!/bin/bash
# Run before pushing

echo "🧪 Running test suite..."

# Unit tests (fast)
bun test || exit 1

# Type checking
bun run typecheck || exit 1

# E2E tests
bun run test:e2e || exit 1

# Rust tests (if changed)
if git diff --name-only origin/main | grep -q "src-tauri"; then
  cd apps/desktop/src-tauri
  cargo test || exit 1
fi

echo "✅ All checks passed!"
```

### CI Test Stages

```yaml
# .github/workflows/ci.yml
jobs:
  web-pipeline:
    steps:
      - name: Unit Tests
        run: bun test tests/unit
      
      - name: E2E Tests
        run: |
          cd apps/desktop/dist
          python3 -m http.server 1420 &
          bun run test:e2e
  
  rust-test:
    needs: rust-lint
    steps:
      - name: Rust Tests
        run: cargo test --locked
```

**Optimization**:
- Unit tests run early (fail fast)
- E2E tests run after build (expensive)
- Rust tests run in parallel matrix (macos/ubuntu/windows)

---

## 8. Test Maintenance

### When to Update Tests

✅ **DO update when**:
- User-facing behavior changes
- Accessibility attributes added/changed
- Component structure refactored
- New critical path added

❌ **DON'T update when**:
- Internal implementation changed (but behavior same)
- CSS classes renamed
- File moved (but interface same)

### Keeping Tests Green

- **Fix broken tests immediately** — don't merge with red tests
- **Delete obsolete tests** — if feature removed, remove its tests
- **Refactor tests with code** — tests are first-class code
- **One logical assertion per test** — easier to debug failures

### Test Code Quality

Tests should follow the same standards as production code:

```typescript
// ✅ GOOD: Clear, focused, maintainable
describe('BlamePanel', () => {
  it('displays commit author and date for each hunk', () => {
    const blame = demoFileBlame('test.ts');
    expect(blame.hunks[0].commit.author).toBe('Alice');
    expect(blame.hunks[0].commit.date).toBeDefined();
  });
});

// ❌ BAD: Unclear, testing too many things
describe('BlamePanel', () => {
  it('works correctly', () => {
    const blame = demoFileBlame('test.ts');
    expect(blame).toBeTruthy();
    expect(blame.hunks.length).toBeGreaterThan(0);
    expect(blame.hunks[0]).toBeDefined();
    // ... 20 more assertions
  });
});
```

---

## 9. Related Documents

- [Quality Checklist](./Quality-Checklist.md) — Comprehensive quality gates
- [Development](./Development.md) — Setup and workflow
- [Coding Standards](./Coding-Standards.md) — Code style

---

## 10. Testing Philosophy

> "Tests are not about proving code works.  
> They're about documenting expected behavior and catching regressions."

### Good Test Characteristics

- **Fast** — Unit tests should be <1s total
- **Isolated** — Each test is independent
- **Repeatable** — Same input = same output
- **Self-checking** — Pass/fail is automated
- **Timely** — Written with (or before) code

### When NOT to Write Tests

- Feature is prototyping phase (will be rewritten)
- Code is generated (e.g., from schema)
- Test would be more complex than the code itself
- Behavior is trivial (simple getters)

**Remember**: The goal is confidence, not coverage percentage.
