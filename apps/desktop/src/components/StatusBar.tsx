import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, Check, ChevronUp, Columns3, FolderTree, GitBranch, GitPullRequest, PanelLeft, Pencil, ZoomIn } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Hint,
  Input,
  cn,
} from '@angkorgit/design-system';
import { appVersion, ipc, openExternal } from '@/core/ipc';
import { useForge } from '@/features/forge/store';
import { useGraph } from '@/features/graph/store';
import { useUndo } from '@/features/history/undoStore';
import { useRepo } from '@/features/repository/store';
import { useSettings } from '@/features/settings/store';
import { useUi } from '@/features/ui/store';
import { capCount, currentPullRequestUrl, formatDate, timeAgo } from '@/shared/utils';
import { toastOutcome } from '@/shared/toastOutcome';
import { forgeNoun, pickForgeRemote } from '@angkorgit/core';
import { useListFocus } from '@/shared/useListFocus';

const ZOOM_LEVELS = [50, 67, 75, 80, 90, 100, 110, 125, 150, 175, 200];

export function StatusBar() {
  const repo = useRepo((s) => s.repo);
  const status = useRepo((s) => s.status);
  const remotes = useRepo((s) => s.remotes);
  const zoom = useSettings((s) => s.zoom);
  const setZoom = useSettings((s) => s.setZoom);
  const [version, setVersion] = useState('');

  useEffect(() => {
    void appVersion().then(setVersion);
  }, []);

  const branches = useRepo((s) => s.branches);
  const changes = status?.files.length ?? 0;
  const branch = repo?.isDetached ? `detached @ ${repo.headOid?.slice(0, 8) ?? '?'}` : repo?.headBranch;
  const headUpstream = branches.find((b) => !b.isRemote && b.isHead)?.upstream ?? null;
  const prUrl = currentPullRequestUrl(repo, pickForgeRemote(remotes, headUpstream)?.url);
  const forgeRepoPath = useForge((s) => s.repoPath);
  const forgeRemote = useForge((s) => s.remote);
  const forgeAccount = useForge((s) => s.hasAccount);
  const openDialog = useUi((s) => s.openDialog);
  const layout = useUi((s) => s.layout);
  const setLayout = useUi((s) => s.setLayout);
  const forgeCurrent = forgeRepoPath !== null && forgeRepoPath === repo?.path;
  const createInApp = forgeCurrent && !!forgeRemote && forgeAccount;
  const prNoun = forgeNoun(forgeCurrent ? forgeRemote?.kind : null);

  return (
    <footer className="flex h-6 shrink-0 items-center gap-3 border-t border-border-subtle bg-surface px-3 text-[11px] text-muted">
      <BranchSwitch label={branch ?? '—'} />
      {status && (status.ahead > 0 || status.behind > 0) && (
        <span className="flex select-none items-center gap-1.5">
          {status.ahead > 0 && (
            <Hint label={`${status.ahead} commit${status.ahead === 1 ? '' : 's'} to push`}>
              <span className="flex items-center gap-0.5 text-success">
                <ArrowUp className="size-3" />
                {capCount(status.ahead)}
              </span>
            </Hint>
          )}
          {status.behind > 0 && (
            <Hint label={`${status.behind} commit${status.behind === 1 ? '' : 's'} to pull`}>
              <span className="flex items-center gap-0.5 text-info">
                <ArrowDown className="size-3" />
                {capCount(status.behind)}
              </span>
            </Hint>
          )}
        </span>
      )}
      <span className={cn('flex select-none items-center gap-1.5', changes > 0 && 'text-primary')}>
        {changes > 0 ? <Pencil className="size-3" /> : <Check className="size-3 text-success" />}
        {changes > 0 ? `${changes} change${changes === 1 ? '' : 's'}` : 'Clean'}
      </span>
      {prUrl && (
        <Hint
          label={
            createInApp
              ? `Create a ${prNoun} for ${repo?.headBranch} without leaving AngKorGit`
              : `Open a pre-filled pull request page for ${repo?.headBranch}`
          }
        >
          <button
            type="button"
            className="flex select-none items-center gap-1 rounded px-1 hover:bg-surface-raised hover:text-foreground"
            onClick={() =>
              createInApp ? openDialog('createPullRequest') : void openExternal(prUrl)
            }
          >
            <GitPullRequest className="size-3" />
            Create {prNoun}
          </button>
        </Hint>
      )}

      <span className="flex-1" />

      <span className="flex items-center">
        <Hint label="Standard layout">
          <button
            type="button"
            className={cn(
              'rounded p-0.5 hover:bg-surface-raised hover:text-foreground',
              layout === 'standard' && 'bg-surface-raised text-foreground',
            )}
            aria-label="Standard layout"
            aria-pressed={layout === 'standard'}
            onClick={() => setLayout('standard')}
          >
            <PanelLeft className="size-3.5" />
          </button>
        </Hint>
        <Hint label="Preview layout">
          <button
            type="button"
            className={cn(
              'rounded p-0.5 hover:bg-surface-raised hover:text-foreground',
              layout === 'preview' && 'bg-surface-raised text-foreground',
            )}
            aria-label="Preview layout"
            aria-pressed={layout === 'preview'}
            onClick={() => setLayout('preview')}
          >
            <Columns3 className="size-3.5" />
          </button>
        </Hint>
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex select-none items-center gap-1 rounded px-1 hover:bg-surface-raised hover:text-foreground"
            aria-label="UI zoom"
          >
            <ZoomIn className="size-3" />
            {Math.round(zoom * 100)}%
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top">
          {ZOOM_LEVELS.map((level) => (
            <DropdownMenuItem key={level} onClick={() => setZoom(level / 100)}>
              <Check className={cn('size-3.5', Math.round(zoom * 100) !== level && 'invisible')} />
              {level}%
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Hint label="Check for updates">
        <button
          type="button"
          className="select-none rounded px-1 hover:bg-surface-raised hover:text-foreground"
          onClick={() => {
            toast.loading('Checking for updates…', { id: 'updater' });
            void import('@/features/updater/check')
              .then(({ checkForUpdates }) => checkForUpdates({ silent: false }))
              .finally(() => toast.dismiss('updater'));
          }}
        >
          {version ? `v${version} · ${__GIT_HASH__}` : 'AngKorGit'}
        </button>
      </Hint>
    </footer>
  );
}

function BranchSwitch({ label }: { label: string }) {
  const repo = useRepo((s) => s.repo);
  const branches = useRepo((s) => s.branches);
  const worktrees = useRepo((s) => s.worktrees);
  const branchSwitcherOpenSeq = useUi((s) => s.branchSwitcherOpenSeq);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const consumedSeqRef = useRef(0);

  useEffect(() => {
    if (branchSwitcherOpenSeq > consumedSeqRef.current) {
      consumedSeqRef.current = branchSwitcherOpenSeq;
      setOpen((prev) => !prev);
    }
  }, [branchSwitcherOpenSeq]);

  const heldBy = useMemo(() => {
    const map = new Map<string, (typeof worktrees)[number]>();
    for (const wt of worktrees) if (wt.branch && !wt.isCurrent) map.set(wt.branch, wt);
    return map;
  }, [worktrees]);

  const locals = useMemo(() => {
    const list = branches.filter((b) => !b.isRemote);
    const current = list.filter((b) => b.isHead);
    const rest = list.filter((b) => !b.isHead).sort((a, b) => a.name.localeCompare(b.name));
    return [...current, ...rest];
  }, [branches]);

  const q = query.trim().toLowerCase();
  const visible = q ? locals.filter((b) => b.name.toLowerCase().includes(q)) : locals;

  const pick = (name: string) => {
    if (!repo) return;
    const held = heldBy.get(name);
    if (held) {
      if (held.isMissing) return;
      void useRepo
        .getState()
        .open(held.path)
        .catch((error) =>
          toast.error(`Could not open ${held.name}: ${(error as { message?: string }).message ?? error}`),
        );
      return;
    }
    if (name === repo.headBranch && !repo.isDetached) return;
    const path = repo.path;
    const opLabel = `Checkout ${name}`;
    void (async () => {
      try {
        const result = await useUndo.getState().tracked({
          path,
          kind: 'checkout',
          label: opLabel,
          action: () => ipc.checkout(path, name),
        });
        toastOutcome(result as { status?: string; message?: string } | undefined, `${opLabel} done`);
        await useRepo.getState().refresh();
        await useGraph.getState().reload(path);
      } catch (error) {
        toast.error(`${opLabel} failed: ${(error as { message?: string }).message ?? error}`);
      }
    })();
  };

  const listFocus = useListFocus({
    items: visible,
    open,
    onSelect: (branch) => {
      setOpen(false);
      pick(branch.name);
    },
    onClose: () => {
      if (query === '') {
        setOpen(false);
      } else {
        setQuery('');
      }
    },
  });

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery('');
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex min-w-0 max-w-56 items-center gap-1.5 rounded px-1 hover:bg-surface-raised hover:text-foreground"
          aria-label="Switch branch"
        >
          <GitBranch className="size-3 shrink-0" />
          <span className="select-none truncate font-mono">{label}</span>
          <ChevronUp className={cn('size-3 shrink-0 transition-transform', open && 'rotate-180')} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="top"
        className="w-80 p-0"
        onCloseAutoFocus={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          listFocus.inputRef.current?.focus();
        }}
      >
        <div
          className="border-b border-border-subtle p-1.5"
          onKeyDown={(e) => {
            if (e.key !== 'Escape') e.stopPropagation();
          }}
        >
          <Input
            ref={listFocus.inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={listFocus.handleInputKeyDown}
            placeholder="Filter branches…"
            className="h-7 text-xs"
            aria-label="Filter branches"
          />
        </div>
        <div ref={listFocus.listRef} className="max-h-64 overflow-y-auto p-1">
          {visible.map((b, index) => {
            const held = heldBy.get(b.name);
            const itemProps = listFocus.getItemProps(index);
            return (
              <DropdownMenuItem
                key={b.name}
                className={cn(
                  'text-xs',
                  listFocus.activeIndex === index && 'bg-surface-raised',
                )}
                onClick={() => pick(b.name)}
                {...itemProps}
              >
                <Check className={cn('size-3.5', !b.isHead && 'invisible')} />
                <span className="min-w-0 flex-1 select-none truncate font-mono">{b.name}</span>
                {held && (
                  <FolderTree
                    className="size-3 shrink-0 text-faint"
                    aria-label={`Checked out in worktree ${held.name}`}
                  />
                )}
                {b.targetTime > 0 && (
                  <span
                    className="shrink-0 text-[10px] tabular-nums text-faint"
                    title={formatDate(b.targetTime)}
                  >
                    {timeAgo(b.targetTime)}
                  </span>
                )}
              </DropdownMenuItem>
            );
          })}
          {visible.length === 0 && (
            <div className="px-2 py-1.5 text-xs text-faint">No branches match</div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
