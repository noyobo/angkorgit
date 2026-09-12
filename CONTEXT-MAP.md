# Context Map

## Contexts

- [Git client](./apps/desktop/CONTEXT.md) — what the user sees and does: surfaces, layouts, and operations
- [Git and forge](./packages/core/CONTEXT.md) — Git objects, identity, and hosting language shared by the engine and the UI

Website copy and design tokens are not domains. Their `CONTEXT.md` files stay uncreated until a term actually belongs there.

## Relationships

- **Git and forge → Git client**: the client names surfaces and operations; it must use forge/git terms as defined in core (Repository, Worktree, Remote, Forge, Pull request, Profile, Account, Stash).
- **Git client → Git and forge**: operations that mutate a Repository (Discard, Checkout, Find vs Filter) are client language for acts whose objects live in core.
