# AngKorGit Coding Standards

This document outlines coding standards and best practices for the AngKorGit project.

## Setup

### Git Hooks (Auto-configured)

The project uses **husky + lint-staged** to automatically format staged files before commit:

- **Automatic setup**: `bun install` automatically configures git hooks
- **Only staged files**: lint-staged formats only the files you're committing (fast!)
- **No manual action needed**: works out of the box after `bun install`

This prevents format-related CI failures.

## React / TypeScript Standards

### Fragment Usage

**Rule: Use explicit `<Fragment>` instead of shorthand `<>`**

#### Rationale

1. **Readability**: Explicit `<Fragment>` clearly expresses intent, especially in complex nested structures
2. **Consistency**: Maintains uniform code style for easier maintenance and review
3. **Debug-friendly**: Easier to identify and locate in development tools

#### Examples

❌ **Incorrect** - Don't use shorthand:
```tsx
return (
  <>
    <div>Content 1</div>
    <div>Content 2</div>
  </>
);
```

✅ **Correct** - Use explicit Fragment:
```tsx
import { Fragment } from 'react';

return (
  <Fragment>
    <div>Content 1</div>
    <div>Content 2</div>
  </Fragment>
);
```

#### Use Cases

- Conditional rendering returning multiple elements
- Wrapping multiple elements in map loops
- Component returning multiple top-level elements

```tsx
// Conditional rendering
{isVisible && (
  <Fragment>
    <Header />
    <Content />
  </Fragment>
)}

// Map loops
{items.map(item => (
  <Fragment key={item.id}>
    <ItemHeader title={item.title} />
    <ItemContent body={item.body} />
  </Fragment>
))}
```

## Pre-commit Checklist

**Before committing code, run these checks locally and ensure all pass:**

```bash
# 1. Biome formatting check
bun x @biomejs/biome ci .

# 2. TypeScript type checking
bun run typecheck

# 3. Rust formatting
cd apps/desktop/src-tauri && cargo fmt

# 4. Rust formatting check
cd apps/desktop/src-tauri && cargo fmt --check

# 5. Rust Clippy (if environment supports)
cd apps/desktop/src-tauri && cargo clippy --all-targets -- -D warnings

# 6. Rust tests (if environment supports)
cd apps/desktop/src-tauri && cargo test
```

**Notes**:
- Steps 1-4 must pass before committing
- Steps 5-6 can rely on CI if local environment has issues (e.g., edition2024)
- This avoids multiple commits fixing CI issues and improves efficiency

## TypeScript Standards

- Use strict mode
- Avoid `any` type
- Provide explicit type definitions for public APIs
- Use `interface` for object structures, `type` for unions and complex types

## Naming Conventions

- Components: PascalCase (`BlamePanel`, `DiffViewer`)
- Functions and variables: camelCase (`openBlame`, `fileMenu`)
- Constants: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`, `DEFAULT_TIMEOUT`)
- Types and interfaces: PascalCase (`BlameHunk`, `FileBlame`)

## Comment Guidelines

- Code should be self-explanatory; add comments only when necessary
- Comments should explain "why" not "what"
- Add explanatory comments for complex business logic
- Use JSDoc for public API documentation

## Testing Standards

- New features must include unit tests
- User-visible features must include E2E tests
- Test file naming: `*.test.ts` or `*.spec.ts`
- Test descriptions should clearly state what is being tested

## Git Commit Convention

- Commit messages in English
- Format: `<type>: <description>`
- Types:
  - `feat`: New feature
  - `fix`: Bug fix
  - `refactor`: Code refactoring
  - `style`: Code formatting
  - `test`: Add or modify tests
  - `docs`: Documentation update
  - `chore`: Build tools or dependency updates

## Performance Best Practices

- Use virtualization for large lists (`@tanstack/react-virtual`)
- Avoid unnecessary re-renders with `memo`, `useMemo`, `useCallback`
- Lazy load non-critical resources
- Use appropriate image formats and sizes

## Accessibility

- Provide `aria-label` for interactive elements
- Ensure keyboard accessibility
- Use semantic HTML
- Provide appropriate ARIA attributes
