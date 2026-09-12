import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { toastOutcome } from '@/shared/toastOutcome';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  ChevronDown,
  Command,
  GitBranchPlus,
  Home,
  PanelLeft,
  Redo2,
  RefreshCw,
  Undo2,
  Settings,
  SquareTerminal,
  Tag,
  Archive,
  ArchiveRestore,
  UserRound,
} from 'lucide-react';
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Hint,
  Kbd,
  Separator,
  Spinner,
  cn,
} from '@angkorgit/design-system';
import { ipc } from '@/core/ipc';
import { confirmDialog } from '@/components/confirm';
import { RepoMark } from '@/components/RepoMark';
import { BranchChip } from '@/components/BranchChip';
import { useRepo } from '@/features/repository/store';
import { abortMergeFlow } from '@/features/repository/merge';
import {
  pushOperation,
  pullOperation,
  fetchOperation,
  type OperationContext,
} from '@/features/repository/operations';
import { sidebarVisible, useUi } from '@/features/ui/store';
import { useUndo } from '@/features/history/undoStore';
import { useSettings, type IdentityProfile } from '@/features/settings/store';
import { applyProfileToRepo } from '@/features/settings/profiles';
import { fetchAndClearLocalBranches } from '@/features/repository/fetchClear';
import { capCount, modKey } from '@/shared/utils';
import { logger } from '@/core/logger';

function RepoSwitcher() {
  const repo = useRepo((s) => s.repo);
  const busy = useRepo((s) => s.busy);
  const setRecentReposOpen = useUi((s) => s.setRecentReposOpen);

  if (!repo) return null;

  return (
    <Hint
      label={
        <span className="flex items-center gap-1">
          Recent repositories <Kbd>{modKey()}</Kbd>
          <Kbd>O</Kbd>
        </span>
      }
    >
      <button
        className={cn(
          'mx-1 flex items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-surface-raised',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
        )}
        disabled={!!busy}
        onClick={() => {
          void logger.click('repo-switcher', 'toolbar-button');
          setRecentReposOpen(true);
        }}
        aria-label="Open recent repositories"
      >
        <RepoMark name={repo.name} size={22} />
        <span className="select-none text-sm font-semibold leading-tight text-foreground">{repo.name}</span>
      </button>
    </Hint>
  );
}

function ProfileButton() {
  const repo = useRepo((s) => s.repo);
  const profiles = useSettings((s) => s.profiles);
  const profileId = useRepo((s) => s.profileId);
  const [activeEmail, setActiveEmail] = useState('');

  useEffect(() => {
    if (!repo?.path) return;
    void ipc.configGet(repo.path, 'user.email').then((email) => setActiveEmail(email ?? ''));
  }, [repo?.path]);

  const assignProfile = async (profile: IdentityProfile) => {
    if (!repo) return;
    try {
      await applyProfileToRepo(repo.path, profile);
      setActiveEmail(profile.email);
      toast.success(`${repo.name} now uses the "${profile.label}" profile`);
    } catch (error) {
      toast.error(`Could not switch profile: ${(error as { message?: string }).message ?? error}`);
    }
  };

  if (!repo || profiles.length === 0) return null;

  const assignedProfile =
    profiles.find((p) => p.id === profileId) ??
    (profileId ? undefined : profiles.find((p) => p.email === activeEmail));

  return (
    <DropdownMenu>
      <Hint label={assignedProfile ? `Profile: ${assignedProfile.label}` : 'Assign profile'}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="mx-0.5 gap-1.5 px-2"
            aria-label="Assign profile to this repository"
          >
            <UserRound className="size-4" />
            {assignedProfile && (
              <span className="select-none text-xs text-muted">{assignedProfile.label}</span>
            )}
            <ChevronDown className="size-3 text-faint" />
          </Button>
        </DropdownMenuTrigger>
      </Hint>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Profile for {repo.name}</DropdownMenuLabel>
        {profiles.map((profile) => {
          const active = assignedProfile?.id === profile.id;
          return (
            <DropdownMenuItem key={profile.id} onClick={() => void assignProfile(profile)}>
              {active ? <Check className="text-primary" /> : <UserRound />}
              <span className="min-w-0 flex-1 select-none">
                <span className="block">{profile.label}</span>
                <span className="block truncate text-[10px] text-faint">{profile.email}</span>
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const STATE_LABELS: Record<string, string> = {
  rebase: 'Rebase in progress',
  merge: 'Merge in progress',
  cherrypick: 'Cherry-pick in progress',
  revert: 'Revert in progress',
  bisect: 'Bisect in progress',
};

function StateActions({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const repo = useRepo((s) => s.repo);
  if (!repo || repo.state === 'clean') return null;
  const path = repo.path;
  const state = repo.state;

  const finish = () => void onRefresh();

  const continueRebase = () =>
    void (async () => {
      void logger.click('continue-rebase', 'toolbar-state-menu');
      try {
        const outcome = await ipc.rebaseContinue(path);
        toastOutcome(outcome, 'Rebase continued');
      } catch (error) {
        toast.error(`Continue failed: ${(error as { message?: string }).message ?? error}`);
      }
      finish();
    })();

  const abortRebase = () =>
    void (async () => {
      void logger.click('abort-rebase', 'toolbar-state-menu');
      const ok = await confirmDialog({
        title: 'Abort rebase?',
        description:
          'This rewinds the branch to where it was before the rebase started. Commits made during the rebase are discarded.',
        confirmLabel: 'Abort rebase',
        destructive: true,
      });
      if (!ok) return;
      try {
        await ipc.rebaseAbort(path);
        toast.success('Rebase aborted');
      } catch (error) {
        toast.error(`Abort failed: ${(error as { message?: string }).message ?? error}`);
      }
      finish();
    })();

  const abortMerge = () => {
    void logger.click('abort-merge', 'toolbar-state-menu');
    void abortMergeFlow(path);
  };

  const clearState = () =>
    void (async () => {
      void logger.click('clear-state', 'toolbar-state-menu');
      const ok = await confirmDialog({
        title: `Clear ${state} state?`,
        description:
          `Git still marks this repository as mid-${state}. Clearing removes that marker and keeps every file and commit exactly as it is now. Use this when the ${state} is already finished.`,
        confirmLabel: 'Clear state',
      });
      if (!ok) return;
      try {
        await ipc.stateCleanup(path);
        toast.success('State cleared');
      } catch (error) {
        toast.error(`Clear failed: ${(error as { message?: string }).message ?? error}`);
      }
      finish();
    })();

  return (
    <DropdownMenu>
      <Hint label={STATE_LABELS[state] ?? state}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex items-center gap-1 rounded-md border border-danger/40 bg-danger/10 px-2 py-1',
              'font-mono text-[11px] text-danger hover:bg-danger/20',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/60',
            )}
            aria-label={`${state} in progress — actions`}
          >
            <span className="select-none">{state}</span>
            <ChevronDown className="size-3" />
          </button>
        </DropdownMenuTrigger>
      </Hint>
      <DropdownMenuContent align="start" className="min-w-56">
        <DropdownMenuLabel>{STATE_LABELS[state] ?? state}</DropdownMenuLabel>
        {state === 'rebase' && (
          <>
            <DropdownMenuItem onClick={continueRebase}>
              <Redo2 /> Continue rebase
            </DropdownMenuItem>
            <DropdownMenuItem destructive onClick={abortRebase}>
              <Undo2 /> Abort rebase
            </DropdownMenuItem>
          </>
        )}
        {state === 'merge' && (
          <DropdownMenuItem destructive onClick={abortMerge}>
            <Undo2 /> Abort merge
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={clearState}>
          <Check /> Clear state, keep everything as is
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UndoRedoButtons({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const repo = useRepo((s) => s.repo);
  const undoStack = useUndo((s) => s.undoStack);
  const redoStack = useUndo((s) => s.redoStack);
  const path = repo?.path ?? '';

  const nextUndo = [...undoStack].reverse().find((e) => e.repoPath === path);
  const nextRedo = [...redoStack].reverse().find((e) => e.repoPath === path);

  const run = (direction: 'undo' | 'redo') => {
    void logger.click(direction, 'toolbar-button');
    const fn = direction === 'undo' ? useUndo.getState().undo : useUndo.getState().redo;
    void fn(path).then((ok) => {
      if (ok) void onRefresh();
    });
  };

  return (
    <>
      <Hint
        label={
          nextUndo ? (
            <span className="flex items-center gap-1">
              Undo: {nextUndo.label} <Kbd>{modKey()}</Kbd>
              <Kbd>Z</Kbd>
            </span>
          ) : (
            'Nothing to undo'
          )
        }
      >
        <Button
          variant="ghost"
          size="icon"
          aria-label="Undo"
          disabled={!nextUndo}
          onClick={() => run('undo')}
        >
          <Undo2 />
        </Button>
      </Hint>
      <Hint
        label={
          nextRedo ? (
            <span className="flex items-center gap-1">
              Redo: {nextRedo.label} <Kbd>{modKey()}</Kbd>
              <Kbd>⇧</Kbd>
              <Kbd>Z</Kbd>
            </span>
          ) : (
            'Nothing to redo'
          )
        }
      >
        <Button
          variant="ghost"
          size="icon"
          aria-label="Redo"
          disabled={!nextRedo}
          onClick={() => run('redo')}
        >
          <Redo2 />
        </Button>
      </Hint>
    </>
  );
}

export function Toolbar({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const repo = useRepo((s) => s.repo);
  const status = useRepo((s) => s.status);
  const branches = useRepo((s) => s.branches);
  const remotes = useRepo((s) => s.remotes);
  const stashes = useRepo((s) => s.stashes);
  const busy = useRepo((s) => s.busy);
  const setBusy = useRepo((s) => s.setBusy);
  const toggleTerminal = useUi((s) => s.toggleTerminal);
  const toggleSidebar = useUi((s) => s.toggleSidebar);
  const sidebarOpen = useUi(sidebarVisible);
  const openDialog = useUi((s) => s.openDialog);
  const setPaletteOpen = useUi((s) => s.setPaletteOpen);
  const navigate = useNavigate();
  const [spinning, setSpinning] = useState(false);

  if (!repo) return null;
  const latestStash = stashes[0];

  const makeContext = (): OperationContext => ({
    path: repo.path,
    branches,
    remotes,
    source: 'toolbar-button',
  });

  const run = async (label: string, op: () => Promise<{ status: string; message: string } | void>) => {
    if (busy) return;
    void logger.click(label, 'toolbar-button');
    setBusy(label);
    try {
      const outcome = await op();
      if (outcome && 'message' in outcome) {
        toastOutcome(outcome, `${label} complete`);
      } else {
        toast.success(`${label} complete`);
      }
      await onRefresh();
    } catch (error) {
      toast.error(`${label} failed: ${(error as { message?: string }).message ?? error}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <header className="flex h-12 shrink-0 items-center gap-1 border-b border-border-subtle bg-surface px-2">
      <Hint label="Back to repositories">
        <Button variant="ghost" size="icon" aria-label="Home" onClick={() => {
          void logger.click('home', 'toolbar-button');
          navigate('/welcome');
        }}>
          <Home />
        </Button>
      </Hint>
      <Hint
        label={
          <span className="flex items-center gap-1">
            {sidebarOpen ? 'Hide sidebar' : 'Show sidebar'} <Kbd>{modKey()}</Kbd>
            <Kbd>B</Kbd>
          </span>
        }
      >
        <Button
          variant="ghost"
          size="icon"
          aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          className={!sidebarOpen ? 'text-primary' : undefined}
          onClick={() => {
            void logger.click('toggle-sidebar', 'toolbar-button');
            toggleSidebar();
          }}
        >
          <PanelLeft />
        </Button>
      </Hint>
      <RepoSwitcher />
      <BranchChip />
      <ProfileButton />
      <StateActions onRefresh={onRefresh} />

      <UndoRedoButtons onRefresh={onRefresh} />

      <Separator orientation="vertical" className="mx-2 h-6" />

      <div className="flex items-center">
        <Hint
          label={
            <span className="flex items-center gap-1">
              Fetch <Kbd>{modKey()}</Kbd>
              <Kbd>⇧</Kbd>
              <Kbd>T</Kbd>
            </span>
          }
        >
          <Button
            variant="ghost"
            size="sm"
            className="rounded-r-none"
            disabled={!!busy}
            onClick={() => {
              if (busy) return;
              setBusy('Fetch');
              void fetchOperation(makeContext()).finally(() => setBusy(null));
            }}
          >
            <RefreshCw className={busy === 'Fetch' || busy === 'Fetch and clear' ? 'animate-spin' : ''} />
            <span className="select-none">Fetch</span>
          </Button>
        </Hint>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="rounded-l-none" aria-label="Fetch options" disabled={!!busy}>
              <ChevronDown className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              onClick={() => {
                if (busy) return;
                setBusy('Fetch and clear');
                const ctx = makeContext();
                void fetchAndClearLocalBranches(ctx.path, ctx.remotes[0]?.name ?? 'origin', onRefresh).finally(() => setBusy(null));
              }}
            >
              Fetch and clear local branches…
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Hint
        label={
          <span className="flex items-center gap-1">
            Pull
            {status?.behind ? ` (${status.behind} behind)` : ''} <Kbd>{modKey()}</Kbd>
            <Kbd>⇧</Kbd>
            <Kbd>P</Kbd>
          </span>
        }
      >
        <Button
          variant="ghost"
          size="sm"
            disabled={!!busy}
          onClick={() => {
            if (busy) return;
            setBusy('Pull');
            void pullOperation(makeContext()).finally(() => setBusy(null));
          }}
        >
          <ArrowDownToLine />
          <span className="select-none">Pull</span>
          {status && status.behind > 0 && <Badge tone="info">{capCount(status.behind)}</Badge>}
        </Button>
      </Hint>
      <div className="flex items-center">
        <Hint
          label={
            <span className="flex items-center gap-1">
              Push
              {status?.ahead ? ` (${status.ahead} ahead)` : ''} <Kbd>{modKey()}</Kbd>
              <Kbd>P</Kbd>
            </span>
          }
        >
          <Button
            variant="ghost"
            size="sm"
            className="rounded-r-none"
            disabled={!!busy}
            onClick={() => {
              if (busy) return;
              setBusy('Push');
              void pushOperation(makeContext()).finally(() => setBusy(null));
            }}
          >
            <ArrowUpFromLine />
            <span className="select-none">Push</span>
            {status && status.ahead > 0 && <Badge tone="primary">{capCount(status.ahead)}</Badge>}
          </Button>
        </Hint>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="rounded-l-none" aria-label="Push options" disabled={!!busy}>
              <ChevronDown className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => {
              if (busy) return;
              setBusy('Push (force)');
              void pushOperation(makeContext(), { force: true, label: 'Push (force)' }).finally(() => setBusy(null));
            }} destructive>
              Force push
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              if (busy) return;
              setBusy('Push with tags');
              void pushOperation(makeContext(), { tags: true, label: 'Push with tags' }).finally(() => setBusy(null));
            }}>
              Push with tags
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              if (busy) return;
              setBusy('Fetch tags');
              void fetchOperation(makeContext(), { tags: true, prune: false, label: 'Fetch tags' }).finally(() => setBusy(null));
            }}>
              Fetch tags
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator orientation="vertical" className="mx-2 h-6" />

      <Hint
        label={
          <span className="flex items-center gap-1">
            Create branch <Kbd>{modKey()}</Kbd>
            <Kbd>⇧</Kbd>
            <Kbd>N</Kbd>
          </span>
        }
      >
        <Button variant="ghost" size="icon" aria-label="Create branch" onClick={() => {
          void logger.click('create-branch', 'toolbar-button');
          openDialog('createBranch');
        }}>
          <GitBranchPlus />
        </Button>
      </Hint>
      <Hint label="Create tag">
        <Button variant="ghost" size="icon" aria-label="Create tag" onClick={() => {
          void logger.click('create-tag', 'toolbar-button');
          openDialog('createTag');
        }}>
          <Tag />
        </Button>
      </Hint>
      <Hint
        label={
          <span className="flex items-center gap-1">
            Stash changes <Kbd>{modKey()}</Kbd>
            <Kbd>⇧</Kbd>
            <Kbd>S</Kbd>
          </span>
        }
      >
        <Button variant="ghost" size="icon" aria-label="Stash changes" onClick={() => {
          void logger.click('stash-changes', 'toolbar-button');
          openDialog('createStash');
        }}>
          <Archive />
        </Button>
      </Hint>
      <Hint label={latestStash ? `Pop latest stash: ${latestStash.message}` : 'Pop latest stash (nothing stashed)'}>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Pop latest stash"
          disabled={!latestStash || !!busy}
          onClick={() => void run('Pop stash', () => ipc.stashPop(repo.path, 0))}
        >
          <ArchiveRestore />
        </Button>
      </Hint>

      <div className="ml-auto flex items-center gap-1">
        {busy && (
          <span className="mr-1 flex select-none items-center gap-2 text-xs text-muted">
            <Spinner /> {busy}…
          </span>
        )}
        <Hint
          label={
            <span className="flex items-center gap-1">
              Command palette <Kbd>{modKey()}</Kbd>
              <Kbd>K</Kbd>
            </span>
          }
        >
          <Button variant="ghost" size="icon" aria-label="Command palette" onClick={() => {
            void logger.click('command-palette', 'toolbar-button');
            setPaletteOpen(true);
          }}>
            <Command />
          </Button>
        </Hint>
        <Hint
          label={
            <span className="flex items-center gap-1">
              Terminal <Kbd>Ctrl</Kbd>
              <Kbd>`</Kbd>
            </span>
          }
        >
          <Button variant="ghost" size="icon" aria-label="Toggle terminal" onClick={() => {
            void logger.click('toggle-terminal', 'toolbar-button');
            toggleTerminal();
          }}>
            <SquareTerminal />
          </Button>
        </Hint>
        <Hint
          label={
            <span className="flex items-center gap-1">
              Refresh <Kbd>{modKey()}</Kbd>
              <Kbd>R</Kbd>
            </span>
          }
        >
          <Button
            variant="ghost"
            size="icon"
            aria-label="Refresh"
            onClick={() => {
              void logger.click('refresh', 'toolbar-button');
              setSpinning(true);
              void onRefresh().finally(() => setSpinning(false));
            }}
          >
            <RefreshCw className={spinning ? 'animate-spin' : ''} />
          </Button>
        </Hint>
        <Hint
          label={
            <span className="flex items-center gap-1">
              Settings <Kbd>{modKey()}</Kbd>
              <Kbd>,</Kbd>
            </span>
          }
        >
          <Button variant="ghost" size="icon" aria-label="Settings" onClick={() => {
            void logger.click('settings', 'toolbar-button');
            openDialog('settings');
          }}>
            <Settings />
          </Button>
        </Hint>
      </div>
    </header>
  );
}
