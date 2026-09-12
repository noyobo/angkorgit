import type { BranchInfo, RemoteInfo } from '@angkorgit/core';
import { toast } from 'sonner';
import { ipc, openExternal } from '@/core/ipc';
import { logger } from '@/core/logger';
import { toastOutcome } from '@/shared/toastOutcome';
import { useGraph } from '../graph/store';
import { useUndo } from '../history/undoStore';
import { ensureRepoProfile } from '../settings/profiles';
import { useRepo } from './store';

/**
 * operations.ts - Unified repository operations module
 *
 * Centralizes Push, Pull, Fetch, View on remote, and Checkout operations.
 * All entry points (Toolbar, Palette, Menu, Graph, Sidebar) delegate to these.
 *
 * Key responsibilities:
 * - Remote selection policy (upstream-aware for push, first remote for pull/fetch)
 * - Profile stamping before push (ADR 0002)
 * - Forge reload after push
 * - State refresh coordination
 * - Error handling and user feedback
 * - Analytics logging
 */

export interface OperationContext {
  path: string;
  branches: BranchInfo[];
  remotes: RemoteInfo[];
  source: string; // For logger.click (e.g., 'toolbar-button', 'command-palette')
}

/**
 * Remote selection policy
 *
 * For push operations: Use the branch's configured upstream remote if it exists,
 * otherwise fall back to the first remote (or 'origin').
 *
 * For pull/fetch operations: Use the first remote (or 'origin').
 *
 * This unifies the remote selection that was scattered and disagreed across
 * Toolbar, Palette, Menu, and Graph.
 */
export function selectRemoteForPush(
  branch: string | undefined,
  branches: BranchInfo[],
  remotes: RemoteInfo[],
): string {
  if (branch) {
    const upstream = branches.find((b) => !b.isRemote && b.name === branch)?.upstream;
    if (upstream) {
      const remoteName = upstream.split('/')[0];
      if (remotes.some((r) => r.name === remoteName)) return remoteName;
    }
  }
  return remotes[0]?.name ?? 'origin';
}

export function selectRemoteForFetch(remotes: RemoteInfo[]): string {
  return remotes[0]?.name ?? 'origin';
}

/**
 * Push operation
 *
 * Pushes commits to the remote. Optionally pushes a specific branch.
 *
 * Flow:
 * 1. Ensure repo profile is assigned (ADR 0002)
 * 2. Select appropriate remote (upstream-aware)
 * 3. Execute push via IPC
 * 4. Refresh repo state
 * 5. Reload forge data (PRs, etc.)
 *
 * @param ctx Operation context
 * @param options Push options
 */
export async function pushOperation(
  ctx: OperationContext,
  options: {
    branch?: string;
    force?: boolean;
    tags?: boolean;
    label?: string;
  } = {},
): Promise<void> {
  const { path, branches, remotes, source } = ctx;
  const { branch, force = false, tags = false, label = 'Push' } = options;

  void logger.click(label.toLowerCase().replace(/\s+/g, '-'), source);

  // Step 1: Ensure profile (ADR 0002 - profile stamp stays inside push)
  await ensureRepoProfile(path);

  // Step 2: Select remote (unified policy)
  const remote = selectRemoteForPush(branch, branches, remotes);

  // Step 3: Execute push
  try {
    const result = await ipc.push(path, remote, force, tags, true, branch, source);
    toastOutcome(result, `${label} complete`);
  } catch (error) {
    toast.error(`${label} failed: ${(error as { message?: string }).message ?? error}`);
    throw error;
  }

  // Step 4: Refresh state
  await useRepo.getState().refresh();

  // Step 5: Reload forge data (PRs, etc.)
  void import('../forge/store').then(({ useForge }) => useForge.getState().load(true));
}

/**
 * Pull operation
 *
 * Pulls commits from the remote and merges them into the current branch.
 *
 * Flow:
 * 1. Select remote
 * 2. Execute pull via IPC
 * 3. Refresh repo state
 * 4. Reload graph
 */
export async function pullOperation(ctx: OperationContext): Promise<void> {
  const { path, remotes, source } = ctx;

  void logger.click('pull', source);

  const remote = selectRemoteForFetch(remotes);

  try {
    const result = await ipc.pull(path, remote);
    toastOutcome(result, 'Pull complete');
  } catch (error) {
    toast.error(`Pull failed: ${(error as { message?: string }).message ?? error}`);
    throw error;
  }

  await useRepo.getState().refresh();
  await useGraph.getState().reload(path);
}

/**
 * Fetch operation
 *
 * Fetches refs and objects from the remote without merging.
 *
 * Flow:
 * 1. Select remote
 * 2. Execute fetch via IPC
 * 3. Refresh repo state
 * 4. Reload graph
 */
export async function fetchOperation(
  ctx: OperationContext,
  options: {
    prune?: boolean;
    tags?: boolean;
    label?: string;
  } = {},
): Promise<void> {
  const { path, remotes, source } = ctx;
  const { prune = true, tags = true, label = 'Fetch' } = options;

  void logger.click(label.toLowerCase().replace(/\s+/g, '-'), source);

  const remote = selectRemoteForFetch(remotes);

  try {
    await ipc.fetch(path, remote, tags, prune);
    toast.success(`${label} complete`);
  } catch (error) {
    toast.error(`${label} failed: ${(error as { message?: string }).message ?? error}`);
    throw error;
  }

  await useRepo.getState().refresh();
  await useGraph.getState().reload(path);
}

/**
 * View on remote operation
 *
 * Opens the repository in the browser on the remote forge (GitHub, GitLab, Bitbucket).
 * Uses pickForgeRemote to select the appropriate remote based on the HEAD branch's
 * upstream configuration.
 *
 * Flow:
 * 1. Check remotes exist
 * 2. Find HEAD branch and its upstream
 * 3. Select forge remote (upstream-aware)
 * 4. Build browse URL
 * 5. Open in external browser
 */
export async function viewOnRemoteOperation(ctx: OperationContext): Promise<void> {
  const { branches, remotes, source } = ctx;

  void logger.click('view-on-remote', source);

  const repo = useRepo.getState().repo;
  if (!repo) {
    toast.error('No repository loaded');
    return;
  }

  if (remotes.length === 0) {
    toast.error('No remotes configured');
    return;
  }

  const { buildBrowseUrl, pickForgeRemote } = await import('@angkorgit/core');

  // Find HEAD branch and its upstream
  const headBranch = branches.find((b) => b.isHead && !b.isRemote);
  const headUpstream = headBranch?.upstream ?? null;

  // Pick the appropriate remote (upstream-aware)
  const remote = pickForgeRemote(remotes, headUpstream);

  // Build URL
  const url = buildBrowseUrl(remote?.url ?? remotes[0].url, repo.headBranch);
  if (!url) {
    toast.error('Could not parse remote URL');
    return;
  }

  // Open in browser
  await openExternal(url);
}

/**
 * Checkout operation
 *
 * Checks out a branch, switching the working tree to that branch.
 * Wrapped in undo tracking. Respects ADR 0003 (switches worktree tab if applicable).
 *
 * Flow:
 * 1. Log action
 * 2. Execute checkout via undo-tracked IPC
 * 3. Toast outcome
 * 4. Refresh state
 */
export async function checkoutOperation(ctx: OperationContext, branch: string): Promise<void> {
  const { path, source } = ctx;

  void logger.click('checkout', source);

  try {
    await useUndo.getState().tracked({
      path,
      kind: 'checkout',
      label: `Checkout ${branch}`,
      action: () => ipc.checkout(path, branch),
    });
    toast.success(`Checked out ${branch}`);
  } catch (error) {
    toast.error(`Checkout failed: ${(error as { message?: string }).message ?? error}`);
    throw error;
  }

  await useRepo.getState().refresh();
  await useGraph.getState().reload(path);
}
