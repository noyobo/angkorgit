import { type EligibleBranch, namesOlderThan } from '@angkorgit/core';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@angkorgit/design-system';
import { AlertTriangle, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { create } from 'zustand';
import { capCount, timeAgo } from '@/shared/utils';
import { BranchPickList } from './BranchPickList';
import { confirmDialog } from './confirm';

export type DeleteBranchesChoice = { names: string[]; remote: boolean };

const AGE_OPTIONS = [
  { days: 90, label: 'Older than 3 months' },
  { days: 180, label: 'Older than 6 months' },
  { days: 365, label: 'Older than 1 year' },
] as const;

interface DeleteBranchesState {
  request: {
    rows: EligibleBranch[];
    hasRemote: boolean;
    resolve: (choice: DeleteBranchesChoice | null) => void;
  } | null;
  ask: (rows: EligibleBranch[], hasRemote: boolean) => Promise<DeleteBranchesChoice | null>;
  settle: (choice: DeleteBranchesChoice | null) => void;
}

const useDeleteBranchesStore = create<DeleteBranchesState>((set, get) => ({
  request: null,
  ask: (rows, hasRemote) =>
    new Promise<DeleteBranchesChoice | null>((resolve) => {
      get().request?.resolve(null);
      set({ request: { rows, hasRemote, resolve } });
    }),
  settle: (choice) => {
    get().request?.resolve(choice);
    set({ request: null });
  },
}));

export function pickDeleteBranches(
  rows: EligibleBranch[],
  hasRemote: boolean,
): Promise<DeleteBranchesChoice | null> {
  return useDeleteBranchesStore.getState().ask(rows, hasRemote);
}

function rowMeta(row: EligibleBranch): string | undefined {
  const parts: string[] = [];
  if (row.time && row.time > 0) parts.push(timeAgo(row.time));
  if (row.ahead && row.ahead > 0) parts.push(`↑${capCount(row.ahead)}`);
  return parts.length ? parts.join(' · ') : undefined;
}

export function DeleteBranchesHost() {
  const { request, settle } = useDeleteBranchesStore();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [age, setAge] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!request) return;
    setPicked(new Set());
    setAge('');
    setFilter('');
  }, [request]);

  const filteredRows = useMemo(() => {
    if (!request) return [];
    if (!filter) return request.rows;
    const lowerFilter = filter.toLowerCase();
    return request.rows.filter((row) => row.name.toLowerCase().includes(lowerFilter));
  }, [request, filter]);

  const count = picked.size;

  return (
    <Dialog open={request !== null} onOpenChange={(open) => !open && settle(null)}>
      <DialogContent
        className="max-w-md"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          confirmRef.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0 text-danger" />
            Delete branches?
          </DialogTitle>
          <DialogDescription>
            Choose local branches to remove. Age shortcuts only change the selection.
          </DialogDescription>
        </DialogHeader>
        {request && (
          <>
            <div className="mb-4 flex gap-2">
              <label className="relative flex-1 flex flex-col gap-1.5 text-xs text-muted">
                Filter branches
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
                  <Input
                    className="h-8 pl-8"
                    placeholder="Type to filter…"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                </div>
              </label>
              <label className="flex-1 flex flex-col gap-1.5 text-xs text-muted">
                Select by age
                <Select
                  key={age ? 'set' : 'idle'}
                  value={age || undefined}
                  onValueChange={(value) => {
                    const days = Number(value);
                    setAge(value);
                    setPicked(new Set(namesOlderThan(request.rows, Date.now() / 1000, days)));
                  }}
                >
                  <SelectTrigger className="h-8" aria-label="Select by age">
                    <SelectValue placeholder="Choose age" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_OPTIONS.map((option) => (
                      <SelectItem key={option.days} value={String(option.days)}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>
            <BranchPickList
              items={filteredRows.map((row) => ({
                name: row.name,
                disabled: Boolean(row.skip),
                detail: row.detail,
                meta: row.skip ? undefined : rowMeta(row),
              }))}
              picked={picked}
              onToggle={(name, checked) => {
                setAge('');
                setPicked((prev) => {
                  const next = new Set(prev);
                  if (checked) next.add(name);
                  else next.delete(name);
                  return next;
                });
              }}
            />
          </>
        )}
        <DialogFooter className="flex-wrap">
          <Button variant="ghost" onClick={() => settle(null)}>
            Cancel
          </Button>
          {request?.hasRemote && (
            <Button
              variant="ghost"
              className="min-w-0 max-w-full text-danger"
              disabled={count === 0}
              onClick={() => {
                const names = [...picked];
                void confirmDialog({
                  title:
                    names.length === 1
                      ? 'Delete this branch on the remote too?'
                      : `Delete ${names.length} on the remote too?`,
                  description:
                    'Removes the local branches and their remotes. This cannot be undone from AngKorGit.',
                  list: names,
                  confirmLabel: 'Delete both',
                  destructive: true,
                }).then((ok) => {
                  if (ok) settle({ names, remote: true });
                });
              }}
            >
              <span className="min-w-0 truncate">Delete local and remote…</span>
            </Button>
          )}
          <Button
            ref={confirmRef}
            variant="danger"
            className="min-w-0 max-w-full"
            disabled={count === 0}
            onClick={() => settle({ names: [...picked], remote: false })}
          >
            <span className="min-w-0 truncate">Delete {count}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
