import { cn } from '@angkorgit/design-system';
import { Command } from 'cmdk';
import { Check, FolderTree, GitBranch } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ipc } from '@/core/ipc';
import { useGraph } from '@/features/graph/store';
import { useUndo } from '@/features/history/undoStore';
import { useRepo } from '@/features/repository/store';
import { useUi } from '@/features/ui/store';
import { toastOutcome } from '@/shared/toastOutcome';
import { formatDate, timeAgo } from '@/shared/utils';
import { PaletteShell } from './PaletteShell';

export function SwitchBranchPanel() {
  const repo = useRepo((s) => s.repo);
  const branches = useRepo((s) => s.branches);
  const worktrees = useRepo((s) => s.worktrees);
  const branchSwitcherOpen = useUi((s) => s.branchSwitcherOpen);
  const setBranchSwitcherOpen = useUi((s) => s.setBranchSwitcherOpen);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (branchSwitcherOpen) {
      setQuery('');
    }
  }, [branchSwitcherOpen]);

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return locals;
    return locals.filter((b) => b.name.toLowerCase().includes(q));
  }, [locals, query]);

  const pick = (name: string) => {
    if (!repo) return;
    const held = heldBy.get(name);
    if (held) {
      if (held.isMissing) {
        toast.error(`Worktree folder ${held.name} no longer exists`);
        return;
      }
      setBranchSwitcherOpen(false);
      void useRepo
        .getState()
        .open(held.path)
        .catch((error) =>
          toast.error(
            `Could not open ${held.name}: ${(error as { message?: string }).message ?? error}`,
          ),
        );
      return;
    }
    if (name === repo.headBranch && !repo.isDetached) {
      setBranchSwitcherOpen(false);
      return;
    }
    const path = repo.path;
    const opLabel = `Checkout ${name}`;
    setBranchSwitcherOpen(false);
    void (async () => {
      try {
        const result = await useUndo.getState().tracked({
          path,
          kind: 'checkout',
          label: opLabel,
          action: () => ipc.checkout(path, name),
        });
        toastOutcome(
          result as { status?: string; message?: string } | undefined,
          `${opLabel} done`,
        );
        await useRepo.getState().refresh();
        await useGraph.getState().reload(path);
      } catch (error) {
        toast.error(`${opLabel} failed: ${(error as { message?: string }).message ?? error}`);
      }
    })();
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'n' && e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      e.currentTarget.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
      );
    }
    if (e.key === 'p' && e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      e.currentTarget.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }),
      );
    }
  };

  return (
    <PaletteShell
      open={branchSwitcherOpen}
      onOpenChange={setBranchSwitcherOpen}
      label="Switch branch"
      search={query}
      onSearchChange={setQuery}
      searchPlaceholder="Filter branches…"
      shouldFilter={false}
      headerIcon={<GitBranch />}
      dataAttribute="data-branch-switcher-open"
      onSearchKeyDown={handleSearchKeyDown}
    >
      {filtered.length === 0 && locals.length === 0 ? (
        <div className="py-8 text-center text-sm text-faint">
          <p>No branches found</p>
        </div>
      ) : filtered.length === 0 ? (
        <Command.Empty className="py-8 text-center text-sm text-faint">
          No branches match "{query.trim()}".
        </Command.Empty>
      ) : (
        <Command.Group heading={`Local branches · ${filtered.length}`}>
          {filtered.map((branch) => {
            const held = heldBy.get(branch.name);
            return (
              <Command.Item
                key={branch.name}
                value={branch.name}
                onSelect={() => pick(branch.name)}
                className="flex cursor-default select-none items-center gap-3 rounded-md px-2.5 py-2.5 text-sm text-foreground data-[selected=true]:bg-surface-raised"
              >
                <Check className={cn('size-3.5 shrink-0', !branch.isHead && 'invisible')} />
                <span className="min-w-0 flex-1 select-none truncate font-mono">{branch.name}</span>
                {held && (
                  <FolderTree
                    className="size-3 shrink-0 text-primary"
                    aria-label={`Checked out in worktree ${held.name}`}
                  />
                )}
                {branch.targetTime > 0 && (
                  <span
                    className="shrink-0 text-[10px] tabular-nums text-faint"
                    title={formatDate(branch.targetTime)}
                  >
                    {timeAgo(branch.targetTime)}
                  </span>
                )}
              </Command.Item>
            );
          })}
        </Command.Group>
      )}
    </PaletteShell>
  );
}
