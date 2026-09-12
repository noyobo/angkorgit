import { toast } from 'sonner';
import { eligibleLocals } from '@angkorgit/core';
import { ipc } from '@/core/ipc';
import { pickStaleLocals } from '@/components/staleLocalsDialog';
import { useUndo } from '@/features/history/undoStore';
import { useRepo } from './store';

export async function fetchAndClearLocalBranches(
  path: string,
  remote: string,
  refresh: () => Promise<void>,
): Promise<void> {
  const before = useRepo.getState().branches;
  const aheadByName = Object.fromEntries(
    before.filter((branch) => !branch.isRemote).map((branch) => [branch.name, branch.ahead]),
  );
  try {
    await ipc.fetch(path, remote, true, true);
  } catch (error) {
    toast.error(`Fetch failed: ${(error as { message?: string }).message ?? error}`);
    return;
  }
  await refresh();
  const { branches, worktrees } = useRepo.getState();
  const heldBy = Object.fromEntries(
    worktrees
      .filter((wt) => wt.branch && !wt.isCurrent)
      .map((wt) => [wt.branch as string, wt.name]),
  );
  const rows = eligibleLocals({
    kind: 'stale',
    locals: branches,
    remoteBranchNames: branches.filter((branch) => branch.isRemote).map((branch) => branch.name),
    remote,
    aheadByName,
    heldBy,
  });
  if (rows.length === 0) {
    toast.success('No stale local branches');
    return;
  }
  const picked = await pickStaleLocals(rows);
  if (!picked?.length) return;
  const oidOf = Object.fromEntries(rows.map((row) => [row.name, row.oid]));
  try {
    for (const name of picked) {
      await useUndo.getState().tracked({
        path,
        kind: 'branchDelete',
        label: `Delete branch ${name}`,
        extra: { branch: name, ...(oidOf[name] ? { oid: oidOf[name] } : {}) },
        action: () => ipc.deleteBranch(path, name, false),
      });
    }
    toast.success(picked.length === 1 ? `Deleted ${picked[0]}` : `Deleted ${picked.length} local branches`);
  } catch (error) {
    toast.error(`Delete failed: ${(error as { message?: string }).message ?? error}`);
  }
  await refresh();
}
