import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, Check, Columns3, GitBranch, GitPullRequest, PanelLeft, Pencil, ZoomIn } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Hint,
  cn,
} from '@angkorgit/design-system';
import { appVersion, openExternal } from '@/core/ipc';
import { useForge } from '@/features/forge/store';
import { useRepo } from '@/features/repository/store';
import { useSettings } from '@/features/settings/store';
import { useUi } from '@/features/ui/store';
import { capCount, currentPullRequestUrl } from '@/shared/utils';
import { forgeNoun, pickForgeRemote } from '@angkorgit/core';

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
      <button
        type="button"
        className="flex min-w-0 max-w-56 items-center gap-1.5 rounded px-1 hover:bg-surface-raised hover:text-foreground"
        aria-label="Switch branch"
        onClick={() => useUi.getState().setBranchSwitcherOpen(true)}
      >
        <GitBranch className="size-3 shrink-0" />
        <span className="select-none truncate font-mono">{branch ?? '—'}</span>
      </button>
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
