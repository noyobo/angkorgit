# Git and forge

Shared language for Git objects, identity, and hosting. The desktop client consumes these terms; it does not redefine them.

**Repository**:
A working tree the app has open. A linked Worktree is a Repository.
_Avoid_: project（项目）, clone（克隆 — 那是创建操作）

**Worktree**:
Another working tree of the same Git common directory, opened as its own Repository.
_Avoid_: copy（副本）, folder（文件夹 — 目录可以缺失，Worktree 仍列出）, 工作区（那是 Working copy）

**Remote**:
A named Git URL on a Repository.
_Avoid_: Forge, origin（origin 只是其中一个 Remote）, 远程主机（host — Account 也按 host 索引）

**Forge**:
GitHub, GitLab, or Bitbucket Cloud, parsed from a Remote. Which Remote is the forge remote is the current branch's upstream, then origin, then the first — never an arbitrary first Remote.
_Avoid_: host（主机）, GitHub（当泛指三家托管）

**Pull request**:
A review request on a Forge. UI copy says merge request on GitLab; the thing is still a Pull request.
_Avoid_: 把 MR / 合并请求当成第二种对象, Checks（检查 — 不做进桌面）

**Profile**:
A committer name, email, and optional per-host Account bindings, assigned to one Repository. Never a global mode switch.
_Avoid_: account（账户）, user（用户）, GitKraken profile（全局身份档）

**Account**:
An HTTPS token for one host and username, kept in the OS keyring. SSH remotes never consult it. On Bitbucket the git username and the Atlassian email are different fields.
_Avoid_: login（登录）, OAuth, token（令牌 — 令牌是密钥，不是 Account）, 账号墙（GitHub-only 那套，我们不做）

**Stash**:
A recorded WIP that appears on the Graph as its own row. It may hold a subset of paths.
_Avoid_: archive（归档 — 工具栏图标）, commit（提交 — Stash 的 kind 是 stash）

**External Editor**:
The configured app for Open in …. The menu label follows this setting; it is never hardcoded to one IDE.
_Avoid_: Cursor, VS Code, 默认编辑器（当指定了 External Editor 时）

**Submodule pointer change**:
The parent repository's gitlink now points at a different commit.
_Avoid_: dirty submodule（子模块内有未提交改动）, 子模块修改（过宽）

**Dirty submodule**:
Uncommitted changes inside the submodule's own working tree.
_Avoid_: submodule pointer change（指针变了）, 子模块修改（过宽）
