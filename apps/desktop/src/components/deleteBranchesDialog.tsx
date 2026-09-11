import { useEffect, useRef, useState } from 'react';
import { create } from 'zustand';
import { AlertTriangle } from 'lucide-react';
import { namesOlderThan, type DeletableLocalRow } from '@angkorgit/core';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@angkorgit/design-system';
import { capCount, timeAgo } from '@/shared/utils';
import { confirmDialog } from './confirm';
import { BranchPickList } from './BranchPickList';

export type DeleteBranchesChoice = { names: string[]; remote: boolean };

const AGE_OPTIONS = [
  { days: 90, label: 'Older than 3 months' },
  { days: 180, label: 'Older than 6 months' },
  { days: 365, label: 'Older than 1 year' },
] as const;

interface DeleteBranchesState {
  request: {
    rows: DeletableLocalRow[];
    hasRemote: boolean;
    resolve: (choice: DeleteBranchesChoice | null) => void;
  } | null;
  ask: (rows: DeletableLocalRow[], hasRemote: boolean) => Promise<DeleteBranchesChoice | null>;
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
  rows: DeletableLocalRow[],
  hasRemote: boolean,
): Promise<DeleteBranchesChoice | null> {
  return useDeleteBranchesStore.getState().ask(rows, hasRemote);
}

function rowMeta(row: DeletableLocalRow): string | undefined {
  const parts: string[] = [];
  if (row.time > 0) parts.push(timeAgo(row.time));
  if (row.ahead > 0) parts.push(`↑${capCount(row.ahead)}`);
  return parts.length ? parts.join(' · ') : undefined;
}

export function DeleteBranchesHost() {
  const { request, settle } = useDeleteBranchesStore();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [age, setAge] = useState('');

  useEffect(() => {
    if (!request) return;
    setPicked(new Set());
    setAge('');
  }, [request]);

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
            <label className="mb-4 flex flex-col gap-1.5 text-xs text-muted">
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
            <BranchPickList
              items={request.rows.map((row) => ({
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
