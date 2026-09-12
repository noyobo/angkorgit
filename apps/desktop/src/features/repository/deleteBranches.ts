import type { BranchInfo, EligibleBranch } from '@angkorgit/core';
import { eligibleLocals, remoteDeleteTarget } from '@angkorgit/core';
import { toast } from 'sonner';
import { pickDeleteBranches } from '@/components/deleteBranchesDialog';
import { ipc } from '@/core/ipc';
import { useUndo } from '@/features/history/undoStore';
import { ensureRepoProfile } from '@/features/settings/profiles';
import { useRepo } from './store';

async function deleteLocals(
  path: string,
  names: string[],
  oidOf: Record<string, string>,
): Promise<void> {
  for (const name of names) {
    await useUndo.getState().tracked({
      path,
      kind: 'branchDelete',
      label: `Delete branch ${name}`,
      extra: { branch: name, ...(oidOf[name] ? { oid: oidOf[name] } : {}) },
      action: () => ipc.deleteBranch(path, name, false),
    });
  }
}

function summarize(deleted: string[], skipped: { name: string; reason: string }[]) {
  const skipNote = skipped.map((row) => `${row.name}: ${row.reason}`).join('\n');
  if (skipped.length === 0) {
    toast.success(
      deleted.length === 1 ? `Deleted ${deleted[0]}` : `Deleted ${deleted.length} local branches`,
    );
    return;
  }
  if (deleted.length === 0) {
    toast.error(`Skipped ${skipped.length}`, { description: skipNote });
    return;
  }
  toast.success(`Deleted ${deleted.length} · Skipped ${skipped.length}`, { description: skipNote });
}

async function deleteLocalsAndRemotes(
  path: string,
  names: string[],
  branches: BranchInfo[],
  firstRemote: string | undefined,
  oidOf: Record<string, string>,
): Promise<void> {
  await ensureRepoProfile(path);
  const byName = Object.fromEntries(branches.filter((b) => !b.isRemote).map((b) => [b.name, b]));
  const deleted: string[] = [];
  const skipped: { name: string; reason: string }[] = [];
  for (const name of names) {
    const target = remoteDeleteTarget(name, byName[name]?.upstream ?? null, firstRemote);
    if (!target) {
      skipped.push({ name, reason: 'No remote' });
      continue;
    }
    let exists: boolean;
    try {
      exists = await ipc.remoteHasRef(path, target.remote, `refs/heads/${target.remoteName}`);
    } catch (error) {
      skipped.push({ name, reason: (error as { message?: string }).message ?? String(error) });
      continue;
    }
    if (!exists) {
      try {
        await useUndo.getState().tracked({
          path,
          kind: 'branchDelete',
          label: `Delete branch ${name}`,
          extra: { branch: name, ...(oidOf[name] ? { oid: oidOf[name] } : {}) },
          action: () => ipc.deleteBranch(path, name, false),
        });
        deleted.push(name);
      } catch (error) {
        skipped.push({ name, reason: (error as { message?: string }).message ?? String(error) });
      }
      continue;
    }
    try {
      await ipc.deleteBranchLocalAndRemote(path, name, target.remote, target.remoteName);
      deleted.push(name);
    } catch (error) {
      skipped.push({ name, reason: (error as { message?: string }).message ?? String(error) });
    }
  }
  summarize(deleted, skipped);
}

export async function openDeleteBranches(refresh: () => Promise<void>): Promise<void> {
  const { repo, branches, worktrees, remotes } = useRepo.getState();
  if (!repo) return;
  const heldBy = Object.fromEntries(
    worktrees
      .filter((wt) => wt.branch && !wt.isCurrent)
      .map((wt) => [wt.branch as string, wt.name]),
  );
  const rows: EligibleBranch[] = eligibleLocals('age', { locals: branches, heldBy });
  const choice = await pickDeleteBranches(rows, remotes.length > 0);
  if (!choice?.names.length) return;
  const oidOf = Object.fromEntries(rows.map((row) => [row.name, row.oid]));
  try {
    if (choice.remote) {
      await deleteLocalsAndRemotes(repo.path, choice.names, branches, remotes[0]?.name, oidOf);
    } else {
      await deleteLocals(repo.path, choice.names, oidOf);
      toast.success(
        choice.names.length === 1
          ? `Deleted ${choice.names[0]}`
          : `Deleted ${choice.names.length} local branches`,
      );
    }
  } catch (error) {
    toast.error(`Delete failed: ${(error as { message?: string }).message ?? error}`);
  }
  await refresh();
}
