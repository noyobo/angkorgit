import { toast } from 'sonner';
import { confirmDialog } from '@/components/confirm';
import { ipc } from '@/core/ipc';
import { useCommitDraft } from '@/features/commit/draftStore';
import { useGraph } from '@/features/graph/store';
import { useRepo } from '@/features/repository/store';

export async function abortMergeFlow(path: string): Promise<void> {
  const ok = await confirmDialog({
    title: 'Abort merge?',
    description: 'This resets the working copy to the state before the merge started.',
    confirmLabel: 'Abort merge',
    destructive: true,
  });
  if (!ok) return;
  try {
    await ipc.mergeAbort(path);
  } catch (error) {
    toast.error(`Abort failed: ${(error as { message?: string }).message ?? error}`);
    return;
  }
  toast.success('Merge aborted');
  useCommitDraft.getState().setDraft(path, '');
  try {
    await useRepo.getState().refresh();
    await useGraph.getState().reload(path);
  } catch (error) {
    toast.error(`Refresh failed: ${(error as { message?: string }).message ?? error}`);
  }
}
