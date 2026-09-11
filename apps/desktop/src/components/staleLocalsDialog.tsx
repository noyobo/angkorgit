import { useEffect, useRef, useState } from 'react';
import { create } from 'zustand';
import { AlertTriangle } from 'lucide-react';
import type { StaleLocalRow } from '@angkorgit/core';
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@angkorgit/design-system';

interface StaleLocalsState {
  request: { rows: StaleLocalRow[]; resolve: (names: string[] | null) => void } | null;
  ask: (rows: StaleLocalRow[]) => Promise<string[] | null>;
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

export function pickStaleLocals(rows: StaleLocalRow[]): Promise<string[] | null> {
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

  const deletable = request?.rows.filter((row) => !row.skip) ?? [];
  const skipped = request?.rows.filter((row) => row.skip) ?? [];
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
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {deletable.map((row) => (
            <label
              key={row.name}
              className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-surface-raised"
            >
              <Checkbox
                checked={picked.has(row.name)}
                onCheckedChange={(value) => {
                  setPicked((prev) => {
                    const next = new Set(prev);
                    if (value === true) next.add(row.name);
                    else next.delete(row.name);
                    return next;
                  });
                }}
                aria-label={`Delete ${row.name}`}
              />
              <span className="min-w-0 truncate font-mono text-xs">{row.name}</span>
            </label>
          ))}
          {skipped.map((row) => (
            <label
              key={row.name}
              className="flex items-center gap-2 rounded-md px-1.5 py-1 text-sm text-muted"
            >
              <Checkbox checked={false} disabled aria-label={`${row.name} kept`} />
              <span className="min-w-0 flex-1 truncate font-mono text-xs">{row.name}</span>
              <span className="shrink-0 text-[10px] text-faint">{row.detail}</span>
            </label>
          ))}
        </div>
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
