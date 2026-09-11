# Coming from GitHub Desktop

If you're familiar with GitHub Desktop, this guide will help you map your knowledge to AngKorGit and understand the key differences.

## Concept mapping

| GitHub Desktop | AngKorGit | Notes |
|----------------|-----------|-------|
| Changes / History tabs | Working Copy / Graph panels | Always visible side-by-side in the main window |
| Repository list dropdown | Repository tabs | Open multiple repos in tabs; ⌘1–9 switches between them |
| Current repository dropdown | Tab strip at top | Shows all open repositories |
| Branch menu | Sidebar → Branches section | Full branch tree with folders |
| Fetch/Pull/Push toolbar | Toolbar split-button | Fetch dropdown includes "Fetch and clear local branches" |
| Stash changes menu | Toolbar Archive button | Archive button creates stashes, ArchiveRestore pops latest |
| History → single commit | Graph row → Inspector | Select a commit to see its files and diff in the right panel |
| Diff view | Center Diff Panel | Opens when you click a file; ` [ ` / ` ] ` navigate between files |
| Branch list search | Sidebar filter box | Type to filter branches, tags, remotes, stashes |
| Command Palette | ⌘K Palette | Quick access to all actions |

## Keyboard shortcuts

| Action | GitHub Desktop | AngKorGit |
|--------|---------------|-----------|
| New repository | ⌘N | ⌘N |
| Add local repository | ⌘O | ⌘O |
| Clone repository | ⌘⇧O | ⌘⇧O |
| Show preferences | ⌘, | ⌘, (Settings) |
| **Switch to Changes** | **⌘1** | **N/A** — Working Copy is always visible |
| **Switch to History** | **⌘2** | **N/A** — Graph is always visible |
| **Switch tabs** | **N/A** | **⌘1–9** — switches between open repository tabs |
| Find in commit list | ⌘F | ⌘F (focuses graph search) |
| Commit | ⌘⏎ | ⌘⏎ |
| Create branch | ⌘⇧N | ⌘⇧N |
| **New worktree** | **N/A** | **⌘⇧T** (not ⌘⇧W) |
| **Close all tabs** | **N/A** | **⌘⇧W** |
| Show in Finder | ⌘⇧F | ⌘⇧F |
| Open in terminal | ⌃` | ⌃` |
| Push | ⌘P | ⌘P |
| Pull | ⌘⇧P | ⌘⇧P |
| Fetch | ⌘⇧T (Desktop) | ⌘⇧R |
| **Show branches** | **⌘B** | **⌘B** |
| **Toggle sidebar** | **N/A** | **⌘L** |
| Undo | ⌘Z | ⌘Z |
| Redo | ⌘⇧Z | ⌘⇧Z |
| Command palette | ⌘K or ⌘⇧P | ⌘K |

### Important differences

- **⌘1–9 switches repository tabs**, not between Changes/History views (those panels are always visible)
- **⌘⇧W closes all tabs** (Desktop-inspired), not "New Worktree" (use ⌘⇧T for that)
- **⌘B shows the branches list** (Desktop-aligned shortcut)
- **⌘L toggles the sidebar** (branches, worktrees, tags, etc.)
- **⌘⇧R for Fetch** (Desktop uses ⌘⇧T, but AngKorGit reserves that for New Worktree)

## Where to find common features

### Push / Pull

- **Toolbar** at the top → **Fetch / Pull / Push split-button**
- The split button shows the default action (e.g., "Pull") and opens a menu with related options
- Push also available per-branch in the sidebar branch menu and per-commit in the graph row menu

### Preview / Create Pull Request

- **StatusBar** (bottom of window) shows PR icon and "View pull requests" link when available
- **Sidebar → Pull Requests section** lists all PRs for the current remote
- **Create PR** button in the Pull Requests section header or via Command Palette (⌘K → "Create pull request")
- Browser fallback when no account is connected (shown in StatusBar)

### Stash changes

- **Toolbar → Archive button** creates a new stash
- **Toolbar → ArchiveRestore button** (appears when stashes exist) pops the latest stash in one click
- **Sidebar → Stashes section** shows all stashes; right-click for Apply/Pop/Drop menu
- Individual files can be stashed via Working Copy row menu → "Stash this file…"

### Compare branches / Diff range

GitHub Desktop's "Compare → choose any two commits" feature works differently in AngKorGit:

- **Single commit diff**: Click a commit in the graph → Inspector shows that commit's changes
- **Multi-commit range**: Not directly supported. To see a range of commits:
  1. Use the **graph filter** (branch filter dropdown) to narrow the visible commits
  2. Or use **Interactive Rebase** (right-click a commit → "Rebase commits above this onto it…") to review a range before squashing
  3. Or view each commit individually in the Inspector

### Context menus

- **Working Copy file rows**: Right-click for Stage/Unstage/Discard/Stash/History/Open in external app/Show in Finder
- **Graph commit rows**: Right-click for Checkout/Merge/Rebase/Cherry-pick/Revert/Reset/Copy hash
- **Sidebar branch rows**: Right-click for Checkout/Merge/Rebase/Pull/Push/Rename/Delete/Create branch here
- **Sidebar tag rows**: Right-click for Checkout/Push/Delete
- **Sidebar stash rows**: Right-click for Apply/Pop/Drop
- **Sidebar worktree rows**: Right-click for Switch/Reveal/Copy path/Remove

### Commit amend

- **Checkbox below commit box**: "Amend" (with Undo icon)
- When checked, the commit will amend the previous commit instead of creating a new one

### Discard changes

- **Unstaged section header** → Trash icon discards all unstaged changes (with confirmation)
- **Staged section header** → Trash icon discards all staged changes (restores to last commit)
- **Individual file rows** → hover Trash button or row menu → "Discard changes…"
- **Multi-select** → Shift-click or ⌘-click files → right-click → "Discard changes in n files…"

### Branch creation from a commit

- **Graph**: Right-click any commit → "Create branch here…"
- **Current HEAD**: Toolbar → Command Palette (⌘K) → "Create branch" or ⌘⇧N

### Merge / Rebase

- **Merge**: Right-click a branch in the sidebar → "Merge into current" OR drag a branch row onto another
- **Rebase**: Right-click the target commit in the graph → "Rebase current branch onto this commit"
- **Interactive Rebase**: Right-click a commit → "Rebase commits above this onto it…" → reorder/squash/drop in the dialog

### Conflict resolution

- When conflicts occur, a **full-screen conflict resolver** opens automatically
- Pick changes from "Current" (left) or "Incoming" (right) panes, or edit the result directly
- Resolve each conflict block, then click "Mark resolved and continue"
- Multi-file conflicts: header shows "File n of m" with navigation arrows

### View repository on GitHub

- **Command Palette** (⌘K) → "Open repository on GitHub"
- Or the **remote URL in Sidebar → Remotes section** → right-click → "Open in browser"

## Philosophy differences

### Workspace layout

- **GitHub Desktop**: Single-pane with tab switching (Changes ⟷ History)
- **AngKorGit**: Multi-pane with sidebar, graph, inspector, and diff panel all visible at once
  - Working Copy (unstaged/staged files) is always on the left in the Inspector when no commit is selected
  - Graph is always in the center
  - Selecting a commit shows its details in the Inspector (right)
  - Opening a file diff shows it in the center Diff Panel, which folds the sidebar away

### Repository tabs vs. single-window switching

- **GitHub Desktop**: One repository visible at a time; switch via dropdown
- **AngKorGit**: Multiple repository tabs open simultaneously; ⌘1–9 shortcuts switch between them

### Worktrees (unique to AngKorGit)

AngKorGit has first-class support for **Git worktrees** (multiple working directories for the same repo):

- **Sidebar → Worktrees section** lists all worktrees
- **Create worktree** (⌘⇧T or sidebar "+" button) opens a dialog to set up a new linked worktree
- Each worktree can be opened **as its own repository tab** in the app
- Branches held by other worktrees show a FolderTree icon; double-clicking switches to that worktree tab
- Useful for working on multiple branches in parallel (e.g., main in one worktree, feature branch in another)

## Tips for transitioning

1. **Embrace the multi-pane layout**: You don't need to switch views; everything is visible at once. Use the sidebar toggle (⌘B) if you need more space.

2. **Learn the keyboard flow**: ↑/↓ in the graph, → to open Inspector files, ←/→ to navigate files in a diff, ← to return to the graph. See Settings → Shortcuts for the full list.

3. **Use Command Palette (⌘K) liberally**: It's the fastest way to find actions when you're not sure where something lives.

4. **Repository tabs work like browser tabs**: ⌘1–9 to switch, ⌘W to close current, ⌘⇧W to close all. Opening a repository adds a new tab.

5. **Sidebar sections are collapsible**: Click section headers to expand/collapse. "Collapse all" button (in the filter bar) hides everything for maximum graph space.

6. **Forge integration** (GitHub/GitLab/Bitbucket): Connect accounts in Settings → Authentication to see pull requests in the sidebar and create PRs from the app.

7. **AI features**: AngKorGit can generate commit messages, explain diffs, review staged changes, and resolve conflicts with AI. Configure your provider in Settings → AI.

## Feature parity notes

Features GitHub Desktop has that AngKorGit handles differently:

- **"Ignored files" list**: Not shown in the Working Copy panel (intentionally; ignored files are noise). Use the terminal or external editor to manage `.gitignore`.
- **Repository settings panel**: AngKorGit reads git config directly. Edit via Command Palette → "Open in terminal" → `git config ...`
- **Coauthors**: Not yet supported in the commit UI. Add manually in the commit message body: `Co-authored-by: Name <email@example.com>`
- **Submodules**: Shown with a FolderGit2 icon in the Working Copy. Right-click a submodule file → "Open submodule" to switch to that submodule as a repository. Submodule diffs distinguish between pointer changes (commit SHA changed) and dirty state (uncommitted changes inside the submodule).

Features AngKorGit has that GitHub Desktop doesn't:

- **Worktrees** (multiple working directories)
- **Interactive rebase UI** (reorder/squash/drop commits)
- **Linked worktrees** in tabs
- **Forge integration** (pull requests, reviewers, draft status)
- **AI-powered features** (commit message generation, code review, conflict explanation)
- **Stash partial files** (stash only selected files, not the whole working tree)
- **File history panel** (show all commits that touched a file)
- **Multi-select staging/unstaging/discarding** (Shift-click or ⌘-click to select multiple files)

---

**Still have questions?** Check the [full documentation](../README.md) or open an issue on [GitHub](https://github.com/noyobo/angkorgit/issues).
