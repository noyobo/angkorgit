import { motion } from 'framer-motion';
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { CommandPalette } from '@/components/CommandPalette';
import { StatusBar } from '@/components/StatusBar';
import { TitleBarOverlay } from '@/components/TitleBarOverlay';
import { Toolbar } from '@/components/Toolbar';
import { commitShortcut } from '@/features/commit/WorkingCopyPanel';
import { editorCloseShortcut } from '@/features/editor/EditorPanel';
import { InteractiveRebaseDialog } from '@/features/graph/InteractiveRebaseDialog';
import { useGraph } from '@/features/graph/store';
import { useUi } from '@/features/ui/store';
import { WorkspaceLayout } from '@/features/ui/WorkspaceLayout';
import { BlamePanel } from '@/features/blame/BlamePanel';
import { FileHistoryPanel } from '@/features/history/FileHistoryPanel';
import { useRepo } from './store';

const ConflictResolver = lazy(() =>
  import('@/features/conflicts/ConflictResolver').then((m) => ({ default: m.ConflictResolver })),
);

import { Logo } from '@angkorgit/design-system';
import { ipc, listen } from '@/core/ipc';
import { CreatePrDialog } from '@/features/forge/CreatePrDialog';
import { useForge } from '@/features/forge/store';
import { useUndo } from '@/features/history/undoStore';
import { SettingsDialog } from '@/features/settings/SettingsDialog';
import { useSettings } from '@/features/settings/store';
import { killTerminalSession } from '@/features/terminal/sessions';
import { CreateWorktreeDialog } from '@/features/worktrees/CreateWorktreeDialog';
import { useShortcuts } from '@/shared/useShortcuts';
import { basename } from '@/shared/utils';
import { CloneDialog } from './CloneDialog';
import { RepoDialogs } from './RepoDialogs';

const OVERLAY_SHOW_DELAY = 250;
const OVERLAY_MIN_VISIBLE = 450;

function useRepoLoadingOverlay(): boolean {
  const active = useRepo((s) => s.opening !== null || s.refreshing);
  const [visible, setVisible] = useState(false);
  const shownAt = useRef(0);
  useEffect(() => {
    if (active) {
      if (visible) return;
      const timer = window.setTimeout(() => {
        shownAt.current = Date.now();
        setVisible(true);
      }, OVERLAY_SHOW_DELAY);
      return () => window.clearTimeout(timer);
    }
    if (!visible) return;
    const remaining = Math.max(0, OVERLAY_MIN_VISIBLE - (Date.now() - shownAt.current));
    const timer = window.setTimeout(() => setVisible(false), remaining);
    return () => window.clearTimeout(timer);
  }, [active, visible]);
  return visible;
}

function RepoLoadingOverlay() {
  const visible = useRepoLoadingOverlay();
  const opening = useRepo((s) => s.opening);
  const repoName = useRepo((s) => s.repo?.name ?? '');
  if (!visible) return null;
  const name = opening ? basename(opening) : repoName;
  return (
    <div className="animate-fade-in absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-background/95 backdrop-blur-sm">
      <Logo size={64} animated="loop" className="logo-draw-loop text-foreground" />
      {name && <span className="max-w-md truncate text-sm text-muted">Opening {name}…</span>}
    </div>
  );
}

export function RepositoryPage() {
  const repo = useRepo((s) => s.repo);
  const busy = useRepo((s) => s.busy);
  const refresh = useRepo((s) => s.refresh);
  const reload = useGraph((s) => s.reload);
  const navigate = useNavigate();
  const toggleTerminal = useUi((s) => s.toggleTerminal);
  const toggleSidebar = useUi((s) => s.toggleSidebar);
  const setPaletteOpen = useUi((s) => s.setPaletteOpen);
  const conflictFile = useUi((s) => s.conflictFile);
  const closeCenterDiff = useUi((s) => s.closeCenterDiff);
  const closeRangeDiff = useUi((s) => s.closeRangeDiff);

  const repoPath = repo?.path ?? null;
  useEffect(() => {
    if (!repoPath) {
      navigate('/welcome', { replace: true });
      return;
    }
    useGraph.getState().select(null);
    const ui = useUi.getState();
    ui.closeCenterDiff();
    ui.closeEditor();
    ui.closeFileHistory();
    ui.selectFile(null);
    ui.openConflict(null);
    void reload(repoPath);

    let unlisten: (() => void) | undefined;
    let cancelled = false;
    let refreshing = false;
    let pending = false;
    let refsFingerprint: string | null = null;
    const stillCurrent = () => !cancelled && useRepo.getState().repo?.path === repoPath;
    void ipc
      .refFingerprint(repoPath)
      .then((fingerprint) => {
        if (stillCurrent() && refsFingerprint === null) refsFingerprint = fingerprint;
      })
      .catch(() => undefined);
    const handleChange = async () => {
      if (refreshing) {
        pending = true;
        return;
      }
      refreshing = true;
      try {
        do {
          pending = false;
          if (!stillCurrent()) return;
          const fingerprint = await ipc.refFingerprint(repoPath);
          if (!stillCurrent()) return;
          const refsChanged = refsFingerprint !== fingerprint;
          refsFingerprint = fingerprint;
          if (refsChanged) {
            await useRepo.getState().refresh();
            if (!stillCurrent()) return;
            await useGraph.getState().reload(repoPath);
          } else {
            await useRepo.getState().refreshStatus();
          }
        } while (pending && stillCurrent());
      } finally {
        refreshing = false;
      }
    };
    void ipc.watchRepo(repoPath);
    void listen('repo-changed', () => {
      void handleChange().catch(() => undefined);
    }).then((fn) => {
      if (cancelled) fn();
      else unlisten = fn;
    });

    return () => {
      cancelled = true;
      unlisten?.();
      void ipc.watchStop();
    };
  }, [repoPath, reload, navigate]);

  const repoRemotes = useRepo((s) => s.remotes);
  const repoBranches = useRepo((s) => s.branches);
  const forgeKey = useMemo(() => {
    if (repoRemotes.length === 0) return '';
    const upstream = repoBranches.find((b) => !b.isRemote && b.isHead)?.upstream ?? '';
    return `${repoRemotes.map((r) => `${r.name}=${r.url}`).join(',')}|${upstream}`;
  }, [repoRemotes, repoBranches]);
  const showPullRequests = useSettings((s) => s.showPullRequests);
  useEffect(() => {
    if (repoPath && forgeKey && showPullRequests) void useForge.getState().load();
    else useForge.getState().reset();
  }, [repoPath, forgeKey, showPullRequests]);

  const settingsOpen = useUi((s) => s.dialog === 'settings');
  const settingsWasOpen = useRef(false);
  useEffect(() => {
    if (settingsOpen) {
      settingsWasOpen.current = true;
      return;
    }
    if (!settingsWasOpen.current) return;
    settingsWasOpen.current = false;
    if (repoPath && forgeKey && showPullRequests && !useForge.getState().hasAccount) {
      void useForge.getState().load(true);
    }
  }, [settingsOpen, repoPath, forgeKey, showPullRequests]);

  const autoFetchMinutes = useSettings((s) => s.autoFetchMinutes);
  useEffect(() => {
    if (!repoPath || !autoFetchMinutes) return;
    let fetching = false;
    let lastFetch = 0;
    const tick = async () => {
      if (fetching || document.hidden) return;
      if (Date.now() - lastFetch < 30_000) return;
      const state = useRepo.getState();
      if (state.busy || state.repo?.path !== repoPath) return;
      const remote = state.remotes[0]?.name;
      if (!remote) return;
      fetching = true;
      lastFetch = Date.now();
      try {
        await ipc.fetch(repoPath, remote, true, false);
      } catch {
        lastFetch = Date.now() + 4 * 60_000;
      } finally {
        fetching = false;
      }
    };
    const id = window.setInterval(() => void tick(), autoFetchMinutes * 60_000);
    const onFocus = () => void tick();
    window.addEventListener('focus', onFocus);
    void tick();
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [repoPath, autoFetchMinutes]);

  const refreshAll = useCallback(async () => {
    if (!repo) return;
    await refresh();
    await reload(repo.path);
  }, [repo, refresh, reload]);

  const shortcuts = useMemo(
    () => [
      // Command palette - Desktop uses Cmd+K style
      { combo: 'mod+k', handler: () => setPaletteOpen(true) },

      // Panels palette - Go to Panel
      { combo: 'mod+shift+/', handler: () => useUi.getState().setPanelsOpen(true) },

      // View toggles - Desktop-aligned shortcuts
      { combo: 'mod+b', handler: () => useUi.getState().setBranchSwitcherOpen(true) }, // Desktop: Cmd+B opens branch switcher
      { combo: 'ctrl+`', handler: () => toggleTerminal() },
      { combo: 'mod+l', handler: () => toggleSidebar() }, // REMAPPED: Sidebar toggle from Cmd+B to Cmd+L

      // Commit flow - Desktop-aligned
      { combo: 'mod+g', handler: () => useUi.getState().focusCommitSummary() }, // Focus commit summary (Desktop: Cmd+G)

      // View on forge - git-open equivalent (Desktop: Cmd+Shift+G)
      {
        combo: 'mod+shift+g',
        handler: async () => {
          if (!repo) return;
          const { viewOnRemoteOperation } = await import('./operations');
          await viewOnRemoteOperation({
            path: repo.path,
            branches: useRepo.getState().branches,
            remotes: useRepo.getState().remotes,
            source: 'keyboard-shortcut',
          });
        },
      },

      // Tab management - AngKorGit multi-repo feature
      // EXCEPTION: Keep Cmd+1-9 for tab switching (core AngKorGit feature)
      // EXCEPTION: Close All Tabs stays on Cmd+Shift+W (explicit product decision)
      {
        combo: 'mod+shift+w',
        handler: () => {
          const tabs = useUi.getState().repoTabs;
          tabs.forEach((path) => killTerminalSession(path));
          useUi.getState().closeAllTabs();
          useRepo.getState().close();
          navigate('/welcome');
        },
      },

      // Undo/Redo - Desktop-aligned
      {
        combo: 'mod+z',
        skipInInput: true,
        handler: () => {
          const path = useRepo.getState().repo?.path;
          if (path)
            void useUndo
              .getState()
              .undo(path)
              .then((ok) => {
                if (ok) void refreshAll();
              });
        },
      },
      {
        combo: 'mod+shift+z',
        skipInInput: true,
        handler: () => {
          const path = useRepo.getState().repo?.path;
          if (path)
            void useUndo
              .getState()
              .redo(path)
              .then((ok) => {
                if (ok) void refreshAll();
              });
        },
      },

      // Repository actions
      { combo: 'mod+r', handler: () => void refreshAll() }, // Refresh (AngKorGit-specific)
      { combo: 'mod+enter', handler: () => commitShortcut.current?.() }, // Commit when focused

      // Repository sync operations - Desktop-aligned
      {
        combo: 'mod+p',
        handler: async () => {
          if (!repo || busy) return;
          const { pushOperation } = await import('./operations');
          await pushOperation({
            path: repo.path,
            branches: useRepo.getState().branches,
            remotes: useRepo.getState().remotes,
            source: 'keyboard-shortcut',
          });
        },
      },
      {
        combo: 'mod+shift+p',
        handler: async () => {
          if (!repo || busy) return;
          const { pullOperation } = await import('./operations');
          await pullOperation({
            path: repo.path,
            branches: useRepo.getState().branches,
            remotes: useRepo.getState().remotes,
            source: 'keyboard-shortcut',
          });
        },
      },
      {
        combo: 'mod+shift+t',
        handler: async () => {
          if (!repo || busy) return;
          const { fetchOperation } = await import('./operations');
          await fetchOperation({
            path: repo.path,
            branches: useRepo.getState().branches,
            remotes: useRepo.getState().remotes,
            source: 'keyboard-shortcut',
          });
        },
      },

      // Branch operations - Desktop-aligned
      {
        combo: 'mod+shift+n',
        handler: () => useUi.getState().openDialog('createBranch'),
      },
      {
        combo: 'mod+shift+s',
        handler: () => useUi.getState().openDialog('createStash'),
      },

      // Settings - Desktop-aligned
      {
        combo: 'mod+,',
        handler: () => useUi.getState().openDialog('settings'),
      },

      // Escape - close overlays
      {
        combo: 'escape',
        skipWhenOverlayOpen: false,
        handler: () => {
          const ui = useUi.getState();
          if (ui.conflictFile) return;
          if (ui.centerEditor) editorCloseShortcut.current?.();
          else if (ui.rangeDiff) closeRangeDiff();
          else if (ui.centerDiff) closeCenterDiff();
          else if (ui.centerBlame) ui.closeBlame();
          else if (ui.centerFileHistory) ui.closeFileHistory();
        },
      },
    ],
    [setPaletteOpen, toggleTerminal, toggleSidebar, refreshAll, closeCenterDiff, closeRangeDiff],
  );
  useShortcuts(shortcuts);

  if (!repo) return <Navigate to="/welcome" replace />;

  return (
    <motion.div
      className="flex h-full flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <TitleBarOverlay />
      <Toolbar onRefresh={refreshAll} />
      <div className="relative min-h-0 flex-1">
        <RepoLoadingOverlay />
        <WorkspaceLayout repoPath={repo.path} />
      </div>
      <StatusBar />

      <CommandPalette onRefresh={refreshAll} />
      <SettingsDialog />
      <RepoDialogs onDone={refreshAll} />
      <CreatePrDialog />
      <CreateWorktreeDialog />
      <InteractiveRebaseDialog />
      <CloneDialog onCloned={() => void refreshAll()} />
      {conflictFile && (
        <Suspense fallback={null}>
          <ConflictResolver key={conflictFile} file={conflictFile} onResolved={refreshAll} />
        </Suspense>
      )}
    </motion.div>
  );
}
