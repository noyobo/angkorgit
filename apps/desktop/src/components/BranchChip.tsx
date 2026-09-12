import { ArrowDown, ArrowUp, ChevronDown, GitBranch } from 'lucide-react';
import { Badge, Hint, cn } from '@angkorgit/design-system';
import { useRepo } from '@/features/repository/store';
import { useUi } from '@/features/ui/store';
import { capCount } from '@/shared/utils';

export function BranchChip() {
  const repo = useRepo((s) => s.repo);
  const status = useRepo((s) => s.status);
  const setBranchSwitcherOpen = useUi((s) => s.setBranchSwitcherOpen);

  if (!repo) return null;

  const branch = repo.isDetached
    ? `detached @ ${repo.headOid?.slice(0, 8) ?? '?'}`
    : repo.headBranch;
  const ahead = status?.ahead ?? 0;
  const behind = status?.behind ?? 0;
  const hasDivergence = ahead > 0 || behind > 0;

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
        {hasDivergence && (
          <span className="flex shrink-0 items-center gap-1">
            {ahead > 0 && (
              <Badge tone="success" className="gap-0.5 px-1">
                <ArrowUp className="size-2.5" />
                {capCount(ahead)}
              </Badge>
            )}
            {behind > 0 && (
              <Badge tone="info" className="gap-0.5 px-1">
                <ArrowDown className="size-2.5" />
                {capCount(behind)}
              </Badge>
            )}
          </span>
        )}
        <ChevronDown className="size-3 shrink-0 text-faint" />
      </button>
    </Hint>
  );
}
