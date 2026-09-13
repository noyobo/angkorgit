## What & why

<!-- One paragraph: what this PR does and the problem it solves. Link issues with #123. -->

## Screenshots

<!-- Required for UI changes — both dark and light theme if colors are touched. -->

## Checklist

### Code Quality
- [ ] Add the `ci` label when the PR is ready — CI does not run on draft PRs or without that label
- [ ] `bun run format:check && bun run typecheck && bun test` pass
- [ ] `cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test` pass (if Rust changed)
- [ ] All local CI checks pass (see [Quality Checklist](../docs/Quality-Checklist.md#4--pre-pr-phase))

### Testing (see [Testing Guide](../docs/Testing-Guide.md))
- [ ] Unit tests cover new logic and edge cases
- [ ] E2E tests cover critical user flows (not implementation details)
- [ ] Tests use semantic selectors (`getByRole`, not test IDs)
- [ ] New engine functions have integration tests in `tests/git_engine.rs`

### Accessibility (for UI changes)
- [ ] Interactive elements have proper ARIA roles (`role`, `tabIndex`, `aria-label`)
- [ ] Keyboard navigation works (Tab, Enter, Space, Escape)
- [ ] Focus management is correct (no keyboard traps)

### Standards
- [ ] Mutating operations go through the undo `tracked()` wrapper where undoable
- [ ] Colors use design tokens only (no hex in components)
- [ ] No debug code left (`console.log`, `debugger`, commented code)

### Documentation
- [ ] `CHANGELOG.md` updated (user-facing changes)
- [ ] Matching `.cursor/skills/*/SKILL.md` updated (if conventions/architecture changed)
- [ ] Test counts in PR description match actual test files
- [ ] Screenshots attached (for UI changes, both dark and light themes)
