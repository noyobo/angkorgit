// Frontend menu event handlers
// Wires native menu clicks to existing UI actions

import { useRepo } from '@/features/repository/store';
import { useGraph } from '@/features/graph/store';
import { useUi } from '@/features/ui/store';
import { killTerminalSession } from '@/features/terminal/sessions';
import { ipc } from '@/core/ipc';
import { pickDirectory, openExternal } from '@/core/ipc';
import { toast } from 'sonner';
import { toastOutcome } from '@/shared/toastOutcome';

type MenuEventId =
  | 'about'
  | 'settings'
  | 'install-cli'
  | 'open-repo'
  | 'clone-repo'
  | 'find'
  | 'show-changes'
  | 'show-history'
  | 'show-tabs'
  | 'show-branches'
  | 'show-worktrees'
  | 'go-summary'
  | 'toggle-sidebar'
  | 'toggle-terminal'
  | 'push'
  | 'pull'
  | 'fetch'
  | 'open-in-terminal'
  | 'open-in-finder'
  | 'open-in-editor'
  | 'view-on-forge'
  | 'new-worktree'
  | 'refresh'
  | 'close-all-tabs'
  | 'new-branch'
  | 'rename-branch'
  | 'delete-branch'
  | 'discard-all'
  | 'stash-changes'
  | 'merge-branch'
  | 'rebase-branch'
  | 'create-pr'
  | 'show-docs'
  | 'show-shortcuts'
  | 'report-issue'
  | 'show-logs';

export async function handleMenuEvent(
  event: MenuEventId,
  navigate: (path: string) => void,
): Promise<void> {
  const repo = useRepo.getState().repo;
  const repoPath = repo?.path ?? null;
  const ui = useUi.getState();

  try {
    switch (event) {
      // App menu
      case 'about':
        ui.openDialog('settings');
        // TODO: Navigate to About tab when we add one
        break;

      case 'settings':
        ui.openDialog('settings');
        break;

      case 'install-cli':
        void import('@/features/settings/cliTool').then(({ installCliTool }) =>
          installCliTool().catch((error) =>
            toast.error(
              `Could not install: ${(error as { message?: string }).message ?? error}`,
            ),
          ),
        );
        break;

      // File menu
      case 'open-repo': {
        const dir = await pickDirectory('Open a Git repository');
        if (!dir || dir === repoPath) return;
        await useRepo.getState().open(dir);
        navigate('/repo');
        break;
      }

      case 'clone-repo':
        ui.openDialog('clone');
        navigate('/welcome');
        break;

      // Edit menu - Find
      case 'find':
        // Focus search in graph if on repo page
        if (repo) {
          // The graph's Cmd+F handler will focus the search box
          ui.focusGraph();
        }
        break;

      // View menu
      case 'show-changes':
        if (repo) {
          useGraph.getState().select(null); // Deselect to show working copy
          ui.focusGraph();
        }
        break;

      case 'show-history':
        if (repo) {
          // Just focus graph (already showing history)
          ui.focusGraph();
        }
        break;

      case 'show-tabs':
        // Open command palette filtered to tabs (if we implement that)
        // For now, just open palette
        ui.setPaletteOpen(true);
        break;

      case 'show-branches':
        ui.openBranchSwitcher();
        break;

      case 'show-worktrees':
        // Focus worktrees section in sidebar
        ui.setSidebarOpen(true);
        // TODO: Could add a way to scroll to worktrees section
        break;

      case 'go-summary':
        // Focus commit summary box
        if (repo) {
          useGraph.getState().select(null); // Show working copy
          // The commitShortcut ref will be triggered
          // TODO: Could emit a focus event
        }
        break;

      case 'toggle-sidebar':
        ui.toggleSidebar();
        break;

      case 'toggle-terminal':
        ui.toggleTerminal();
        break;

      // Repository menu
      case 'push':
        if (!repoPath) return;
        const pushRemote = useRepo.getState().remotes[0]?.name ?? 'origin';
        const pushResult = await ipc.push(repoPath, pushRemote, false, false, true);
        toastOutcome(pushResult, 'Push complete');
        await useRepo.getState().refresh();
        break;

      case 'pull':
        if (!repoPath) return;
        const pullRemote = useRepo.getState().remotes[0]?.name ?? 'origin';
        const pullResult = await ipc.pull(repoPath, pullRemote);
        toastOutcome(pullResult, 'Pull complete');
        await useRepo.getState().refresh();
        await useGraph.getState().reload(repoPath);
        break;

      case 'fetch':
        if (!repoPath) return;
        const fetchRemote = useRepo.getState().remotes[0]?.name ?? 'origin';
        await ipc.fetch(repoPath, fetchRemote, true, true);
        toast.success('Fetch complete');
        await useRepo.getState().refresh();
        await useGraph.getState().reload(repoPath);
        break;

      case 'open-in-terminal':
        ui.toggleTerminal();
        break;

      case 'open-in-finder':
        if (repoPath) {
          await ipc.revealPath(repoPath);
        }
        break;

      case 'open-in-editor':
        if (repoPath) {
          await ipc.openPath(repoPath);
        }
        break;

      case 'view-on-forge': {
        if (!repo) return;
        const remotes = useRepo.getState().remotes;
        if (remotes.length === 0) {
          toast.error('No remotes configured');
          return;
        }
        // Parse first remote URL to open in browser
        const url = remotes[0].url
          .replace(/^git@([^:]+):/, 'https://$1/')
          .replace(/\.git$/, '');
        await openExternal(url);
        break;
      }

      case 'new-worktree':
        ui.openDialog('createWorktree');
        break;

      case 'refresh':
        if (repoPath) {
          await useRepo.getState().refresh();
          await useGraph.getState().reload(repoPath);
        }
        break;

      case 'close-all-tabs': {
        const tabs = ui.repoTabs;
        tabs.forEach((path) => killTerminalSession(path));
        ui.closeAllTabs();
        useRepo.getState().close();
        navigate('/welcome');
        break;
      }

      // Branch menu
      case 'new-branch':
        ui.openDialog('createBranch');
        break;

      case 'rename-branch':
        // TODO: Could pre-select current branch in rename dialog
        toast.info('Rename branch via sidebar context menu');
        break;

      case 'delete-branch':
        void import('@/features/repository/deleteBranches').then(
          ({ openDeleteBranches }) =>
            openDeleteBranches(async () => {
              if (repoPath) {
                await useRepo.getState().refresh();
                await useGraph.getState().reload(repoPath);
              }
            }),
        );
        break;

      case 'discard-all':
        // TODO: Add confirmation dialog
        toast.info('Discard all via working copy header');
        break;

      case 'stash-changes':
        ui.openDialog('createStash');
        break;

      case 'merge-branch':
        toast.info('Merge via drag-and-drop or branch context menu');
        break;

      case 'rebase-branch':
        toast.info('Rebase via branch context menu');
        break;

      case 'create-pr':
        ui.openDialog('createPullRequest');
        break;

      // Help menu
      case 'show-docs':
        await openExternal('https://github.com/noyobo/angkorgit');
        break;

      case 'show-shortcuts':
        // TODO: Could open settings to shortcuts tab
        ui.openDialog('settings');
        break;

      case 'report-issue':
        await openExternal('https://github.com/noyobo/angkorgit/issues/new');
        break;

      case 'show-logs':
        // TODO: Implement log directory reveal
        toast.info('Logs location: check app data directory');
        break;

      default:
        console.warn('Unhandled menu event:', event);
    }
  } catch (error) {
    toast.error(
      `Menu action failed: ${(error as { message?: string }).message ?? error}`,
    );
  }
}
