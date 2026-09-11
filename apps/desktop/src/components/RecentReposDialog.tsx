import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Clock,
  FolderOpen,
  GitBranchPlus,
  FolderTree,
} from 'lucide-react';
import { Badge, Kbd, Spinner, cn } from '@angkorgit/design-system';
import { PaletteShell } from './PaletteShell';
import { RepoMark } from './RepoMark';
import { useRepo } from '@/features/repository/store';
import { useUi } from '@/features/ui/store';
import { pickDirectory } from '@/core/ipc';
import { modKey, timeAgo } from '@/shared/utils';

function shortenHome(path: string): string {
  return path.replace(/^(\/Users\/[^/]+|\/home\/[^/]+|[A-Z]:\\Users\\[^\\]+)(?=[/\\]|$)/, '~');
}

export function RecentReposDialog() {
  const navigate = useNavigate();
  const { recents, open, opening } = useRepo();
  const recentReposOpen = useUi((s) => s.recentReposOpen);
  const setRecentReposOpen = useUi((s) => s.setRecentReposOpen);
  const worktreeTabs = useUi((s) => s.worktreeTabs);
  const [query, setQuery] = useState('');
  const [missing, setMissing] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (recentReposOpen) {
      setQuery('');
    }
  }, [recentReposOpen]);

  useEffect(() => {
    if (recents.length === 0) {
      setMissing(new Set());
      return;
    }
    let cancelled = false;
    void import('@/core/ipc').then(({ ipc }) => 
      ipc
        .pathsExist(recents.map((r) => r.path))
        .then((flags) => {
          if (cancelled) return;
          setMissing(new Set(recents.filter((_, i) => !flags[i]).map((r) => r.path)));
        })
        .catch(() => undefined)
    );
    return () => {
      cancelled = true;
    };
  }, [recents, recentReposOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recents;
    return recents.filter(
      (r) => r.name.toLowerCase().includes(q) || r.path.toLowerCase().includes(q),
    );
  }, [recents, query]);

  const openRepository = async (path: string) => {
    if (opening !== null) return;
    if (missing.has(path)) {
      toast.error('This folder no longer exists. Remove it from recents or open it from its new location.');
      return;
    }
    setRecentReposOpen(false);
    try {
      await open(path);
      navigate('/repo');
    } catch (error) {
      toast.error(`Could not open repository: ${(error as { message?: string }).message ?? error}`);
    }
  };

  const browse = async () => {
    setRecentReposOpen(false);
    const dir = await pickDirectory('Open a Git repository');
    if (dir) {
      try {
        await open(dir);
        navigate('/repo');
      } catch (error) {
        toast.error(`Could not open repository: ${(error as { message?: string }).message ?? error}`);
      }
    }
  };

  const openClone = () => {
    setRecentReposOpen(false);
    useUi.getState().openDialog('clone');
    navigate('/welcome');
  };

  useEffect(() => {
    if (!recentReposOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘1–9 / Ctrl+1–9 shortcuts for filtered visible repos
      if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        e.stopPropagation();
        const index = parseInt(e.key) - 1;
        if (index < filtered.length) {
          void openRepository(filtered[index].path);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [recentReposOpen, filtered]);

  return (
    <PaletteShell
      open={recentReposOpen}
      onOpenChange={setRecentReposOpen}
      label="Recent repositories"
      search={query}
      onSearchChange={setQuery}
      searchPlaceholder="Filter recent repositories…"
      shouldFilter={false}
      headerIcon={<Clock />}
    >
      {filtered.length === 0 && recents.length === 0 ? (
          <div className="py-8 text-center text-sm text-faint">
            <p className="mb-4">No repositories yet</p>
            <p className="text-xs">Open a folder or clone a repository to get started.</p>
          </div>
        ) : filtered.length === 0 ? (
          <Command.Empty className="py-8 text-center text-sm text-faint">
            No repositories match "{query.trim()}".
          </Command.Empty>
        ) : (
          <>
            <Command.Group heading={`Recent repositories · ${filtered.length}`}>
              {filtered.slice(0, 20).map((repo, index) => {
                const gone = missing.has(repo.path);
                const isWorktree = worktreeTabs.includes(repo.path);
                const showKbd = index < 9;
                return (
                  <Command.Item
                    key={repo.path}
                    value={repo.path}
                    disabled={gone}
                    onSelect={() => void openRepository(repo.path)}
                    className={cn(
                      'flex cursor-default select-none items-center gap-3 rounded-md px-2.5 py-2.5 text-sm',
                      gone
                        ? 'cursor-not-allowed text-muted data-[selected=true]:bg-surface-raised/50'
                        : 'text-foreground data-[selected=true]:bg-surface-raised',
                    )}
                  >
                    <RepoMark name={repo.name} size={32} faded={gone} />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-tight">
                      <span className="flex items-center gap-2">
                        <span className={cn('truncate font-medium', gone ? 'text-muted' : 'text-foreground')}>
                          {repo.name}
                        </span>
                        {isWorktree && !gone && (
                          <FolderTree className="size-3.5 shrink-0 text-primary" />
                        )}
                        {gone && (
                          <Badge tone="danger" className="shrink-0 gap-1 px-1.5 py-0 text-[10px]">
                            <AlertTriangle className="size-2.5" /> folder missing
                          </Badge>
                        )}
                      </span>
                      <span className="truncate font-mono text-[11px] text-faint" title={repo.path}>
                        {shortenHome(repo.path)}
                      </span>
                    </span>
                    {opening === repo.path ? (
                      <Spinner className="size-3.5 shrink-0 text-primary" />
                    ) : (
                      <>
                        <span className="shrink-0 text-xs text-faint">{timeAgo(repo.lastOpenedAt)}</span>
                        {showKbd && !gone && (
                          <span className="flex shrink-0 items-center gap-0.5 opacity-60">
                            <Kbd className="text-[10px]">{modKey()}</Kbd>
                            <Kbd className="text-[10px]">{index + 1}</Kbd>
                          </span>
                        )}
                      </>
                    )}
                  </Command.Item>
                );
              })}
            </Command.Group>

            <Command.Group heading="Add repository">
              <Command.Item
                onSelect={browse}
                className="flex cursor-default select-none items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-foreground data-[selected=true]:bg-surface-raised"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                  <FolderOpen className="size-4" />
                </span>
                <span className="flex-1">
                  <span className="block font-medium">Browse local folder…</span>
                  <span className="block text-xs text-muted">Open an existing Git repository</span>
                </span>
              </Command.Item>
              <Command.Item
                onSelect={openClone}
                className="flex cursor-default select-none items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-foreground data-[selected=true]:bg-surface-raised"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-info/15 text-info">
                  <GitBranchPlus className="size-4" />
                </span>
                <span className="flex-1">
                  <span className="block font-medium">Clone repository…</span>
                  <span className="block text-xs text-muted">From a remote URL</span>
                </span>
              </Command.Item>
            </Command.Group>
          </>
        )}
    </PaletteShell>
  );
}
