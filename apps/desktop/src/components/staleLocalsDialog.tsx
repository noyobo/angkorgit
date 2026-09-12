import type { EligibleBranch } from '@angkorgit/core';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@angkorgit/design-system';
import { AlertTriangle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { create } from 'zustand';
import { BranchPickList } from './BranchPickList';

interface StaleLocalsState {
  request: { rows: EligibleBranch[]; resolve: (names: string[] | null) => void } | null;
  ask: (rows: EligibleBranch[]) => Promise<string[] | null>;
  settle: (names: string[] | null) => void;
}

const useStaleLocalsStore = create<StaleLocalsState>((set, get) => ({
  request: null,
  ask: (rows) =>
    new Promise<string[] | null>((resolve) => {
      get().request?.resolve(null);
      set({ request: { rows, resolve } });
    }),
  settle: (names) => {
    get().request?.resolve(names);
    set({ request: null });
  },
}));

export function pickStaleLocals(rows: EligibleBranch[]): Promise<string[] | null> {
  return useStaleLocalsStore.getState().ask(rows);
}

export function StaleLocalsHost() {
  const { request, settle } = useStaleLocalsStore();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!request) return;
    setPicked(new Set(request.rows.filter((row) => !row.skip).map((row) => row.name)));
  }, [request]);

  const count = picked.size;

  return (
    <Dialog open={request !== null} onOpenChange={(open) => !open && settle(null)}>
      <DialogContent
        className="max-w-sm"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          confirmRef.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0 text-danger" />
            Delete stale local branches?
          </DialogTitle>
          <DialogDescription>
            These local branches track a remote branch that is gone. Uncheck any you want to keep.
          </DialogDescription>
        </DialogHeader>
        {request && (
          <BranchPickList
            items={request.rows.map((row) => ({
              name: row.name,
              disabled: Boolean(row.skip),
              detail: row.detail,
            }))}
            picked={picked}
            onToggle={(name, checked) => {
              setPicked((prev) => {
                const next = new Set(prev);
                if (checked) next.add(name);
                else next.delete(name);
                return next;
              });
            }}
          />
        )}
        <DialogFooter className="flex-wrap">
          <Button variant="ghost" onClick={() => settle(null)}>
            Cancel
          </Button>
          <Button
            ref={confirmRef}
            variant="danger"
            className="min-w-0 max-w-full"
            disabled={count === 0}
            onClick={() => settle([...picked])}
          >
            <span className="min-w-0 truncate">Delete {count}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
