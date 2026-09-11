# Git client

The desktop app's language for **surfaces** (where the user stands), **panels** (what they open and dismiss), and **operations** (what they do to a Repository). Folder names under `features/` are not terms.

Desktop's Changes / History tabs are not our surfaces. ⌘1–9 switch Repository tabs, never those two views. See [#3](https://github.com/noyobo/angkorgit/issues/3).

## Surfaces

**Graph**:
The commit history drawn as lanes. In Standard it is the center of the window; in Preview it is a compact commit list (message and date only).
_Avoid_: History tab（历史标签）, commit list（提交列表）, CommitGraph, 历史视图

**Working copy**:
The Inspector's uncommitted side: Conflicts, Changes, Staged, and the commit box.
_Avoid_: Changes tab（更改标签）, status（状态）, WorkingCopyPanel, 工作区（当指 Desktop 的 Changes）

**Inspector**:
The right-hand region. It shows the Working copy, or Commit details when a commit is selected — one region, two modes, never two tabs.
_Avoid_: right panel（右侧面板）, details pane（详情栏）

**Diff**:
A file comparison. In Standard it covers the Graph and hides the Sidebar; in Preview it docks beside the Graph.
_Avoid_: DiffPanel, center view（中间视图）

**Range diff**:
A Diff between two commits, from a Graph multi-select or from Preview diff on a pull request.
_Avoid_: Preview Pull Request（作为独立工作面）, PR 预览（当指一块新界面）

**Sidebar**:
The left region of repository refs: Branches, Worktrees, Pull requests, Tags, Stashes, Remotes, Submodules.
_Avoid_: repository list（仓库列表 — 那是标签栏）, 分支栏（Sidebar 不只分支）

**Conflict resolver**:
A full-window editor for one conflicted file, with sides A, B, and Result.
_Avoid_: merge-tool overlay（合并工具浮层）, conflict dialog（冲突对话框）

**File history**:
The commits that touched one file. Leaving it via Open commit selects that commit on the Graph with all of its files in the Inspector.
_Avoid_: blame（注解 / 追溯 — 未做）

**Repo switcher**:
The toolbar control that shows the current Repository, Worktree, Branch, and Profile together.
_Avoid_: repository dropdown（仓库下拉 — Desktop 的单仓切换）, 顶栏三件套（口头说法，不是术语）

**Repository tab**:
One open working tree in the tab strip. A linked Worktree is its own tab.
_Avoid_: window（窗口）, session（会话）, 仓库列表（Desktop ⌘T）

**Welcome**:
The no-repository screen: recents, Open, Clone. Not a Repository tab.
_Avoid_: start page（启动页）, home（首页）, Recent repositories（那是 ⌘O 面板）

## Panels

A **Panel** is a transient overlay you open and dismiss. A Surface stays in the layout.
_Avoid_: surface（工作面）, dialog（当统称这类入口时用 Panel）, 弹窗（口头说法）

**Command palette**:
The ⌘K list of operations (its Actions group). An entry point, not a place work is done.
_Avoid_: Go to Panel（面板索引）, Actions（那是组名，不是这块面板）

**Go to Panel**:
The ⌘⇧? index of Panels only — Settings, Switch branch, Recent repositories, and the rest.
_Avoid_: Command palette（命令面板）, 快捷键帮助

**Recent repositories**:
The ⌘O Panel of recents. While it is open, ⌘1–9 pick a row; after it closes they switch Repository tabs again.
_Avoid_: Open（打开文件选择器）, Welcome（欢迎页也列出最近仓库，但不是这块面板）, 最近项目

**Switch branch**:
The status-bar Panel of local branches (⌘B). Same Checkout as the Sidebar.
_Avoid_: Show Branches List（显示分支列表）, Branches list（分支列表）, 分支面板（当指 Sidebar 的 Branches 段）

## Layouts

**Standard**:
Graph-centered. Opening a Diff covers the Graph and hides the Sidebar.
_Avoid_: immersive（沉浸式）

**Preview**:
The Graph stays visible as a compact commit list; the Diff docks on the right. Graph display columns are a Standard preference and do not apply here.
_Avoid_: Preview diff（预览 diff — 那是操作）, Preview PR, 预览模式（当指 PR 预览）

## Operations

**Find**:
Locating commits on the Graph by message, hash, or author without changing the walk. Matches are stepped; lanes stay.
_Avoid_: filter（筛选 — 会压扁图）, search（搜索 — 同上）

**Filter**:
Narrowing the Graph walk to one branch, or a file list by path.
_Avoid_: find（查找）

**Discard**:
Putting a path back to HEAD, whether the change is unstaged or staged. Not Unstage, not Drop.
_Avoid_: revert（回滚提交）, restore（恢复）, 还原, 撤销（那是 Undo）

**Apply** (stash files):
Writing chosen paths from a Stash into the working copy, leaving the Stash in place.
_Avoid_: restore（恢复）, pop（弹出）, 还原

**Pop**:
Applying the latest Stash and dropping it.
_Avoid_: Apply（应用文件并留下 Stash）, 恢复

**Checkout** (remote):
Making a local branch match a remote-tracking branch: create and track if missing, fast-forward if behind, leave alone if diverged.
_Avoid_: pull（拉取）, Update from default branch（从默认分支更新）

**Reset branch to remote**:
Hard-resetting a diverged local branch onto its remote chip. Offered only when the local is ahead.
_Avoid_: checkout（检出）, 重置（口头过宽）

**Fetch**:
Downloading from a Remote without moving HEAD. Not Pull, not Sync.
_Avoid_: Sync（同步）, Pull（拉取）, 刷新（那是 Refresh）

**Pull**:
Fetching, then integrating the current branch with its upstream.
_Avoid_: Fetch（获取）, Sync（同步）

**Push** (from tip):
Publishing a local branch whose tip is the selected commit, via that branch's upstream Remote.
_Avoid_: Sync（同步）

**Preview diff**:
Opening a Range diff of the current branch against the pull-request base, from the create-PR Panel. Same surface as a Graph multi-select Range diff.
_Avoid_: Preview（预览布局）, Preview Pull Request（作为另一块产品）, 预览 PR（当指独立功能）

**View on remote**:
Opening the current branch (or the repository root if detached) in the Forge's browser page. Menu id may say forge; the label is View on Remote.
_Avoid_: View on GitHub（在 GitHub 上查看）, View on Forge（在 Forge 上查看 — 不是按钮文案）

**Open commit**:
Leaving File history and selecting that commit on the Graph, with all of its files in the Inspector.
_Avoid_: Open in browser（在浏览器中打开）

**Open submodule**:
Opening a submodule path as its own Repository tab.
_Avoid_: Open in editor（在编辑器中打开）

**Amend**:
Replacing the last commit from the Working copy, instead of creating a new one.
_Avoid_: Undo（撤销）, 修改提交（过宽）

**Fetch and clear local branches**:
Fetch, then delete local branches whose upstream on that Remote is gone. Default Fetch does not do this.
_Avoid_: Fetch（获取 — 默认 Fetch 不清分支）, 清理分支（过宽）
