# RFCs (Request for Comments)

This directory contains proposals for major technical decisions and architectural changes in Bayon.

## What is an RFC?

An RFC (Request for Comments) is a design document that:
- Proposes a significant change or new feature
- Describes the motivation and context
- Outlines the technical approach
- Considers alternatives
- Discusses risks and trade-offs

## When to Write an RFC

Write an RFC when:
- ✅ Changing core architecture (e.g., switching from libgit2 to CLI)
- ✅ Adding a major feature that affects multiple subsystems
- ✅ Making a decision with long-term implications
- ✅ Proposing a breaking change

**Don't** write an RFC for:
- ❌ Bug fixes
- ❌ Small feature additions
- ❌ Code refactoring that doesn't change behavior
- ❌ Documentation improvements

## RFC Process

1. **Draft**: Copy `template.md`, fill it out, open a PR
2. **Discussion**: Team reviews, asks questions, suggests changes
3. **Decision**: After consensus, status changes to `Accepted` or `Rejected`
4. **Implementation**: If accepted, implement per the RFC plan
5. **Archive**: Once fully implemented, status changes to `Implemented`

## RFC Status

- **Proposed**: Under discussion
- **Accepted**: Approved, ready for implementation
- **Rejected**: Decision made not to proceed
- **Implemented**: Fully completed
- **Deprecated**: Superseded by a later RFC

## Active RFCs

| RFC | Title | Status | Author | Date |
|-----|-------|--------|--------|------|
| [0001](./0001-git-backend-strategy.md) | Git Backend Strategy - CLI vs libgit2 | Proposed | Cursor Agent | 2026-09-23 |

## Template

See [template.md](./template.md) for the RFC template.

## Tips for Writing Good RFCs

1. **Start with "Why"**: Clearly explain the problem you're solving
2. **Show alternatives**: Prove you've considered other approaches
3. **Be specific**: Include code examples, benchmarks, timelines
4. **Think about risks**: What could go wrong? How do we mitigate?
5. **Make it skimmable**: Use tables, lists, diagrams
6. **Link to references**: Prior art, related issues, external docs

## Questions?

Ask in Discord or open a discussion issue.
