import { ChevronDown, GitBranch } from 'lucide-react';
import { Hint, cn } from '@angkorgit/design-system';
import { useRepo } from '@/features/repository/store';
import { useUi } from '@/features/ui/store';

export function BranchChip() {
  const repo = useRepo((s) => s.repo);
  const setBranchSwitcherOpen = useUi((s) => s.setBranchSwitcherOpen);

  if (!repo) return null;

  const branch = repo.isDetached
    ? `detached @ ${repo.headOid?.slice(0, 8) ?? '?'}`
    : repo.headBranch;

  return (
    <Hint label="Switch branch">
      <button
        type="button"
        className={cn(
          'no-drag group flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs transition-colors hover:bg-surface-raised',
        )}
        aria-label="Switch branch"
        data-testid="title-bar-branch-chip"
        onClick={() => setBranchSwitcherOpen(true)}
      >
        <GitBranch className="size-3.5 shrink-0 text-muted group-hover:text-foreground" />
        <span className="max-w-44 select-none truncate font-mono text-foreground">{branch ?? '—'}</span>
        <ChevronDown className="size-3 shrink-0 text-faint" />
      </button>
    </Hint>
  );
}
