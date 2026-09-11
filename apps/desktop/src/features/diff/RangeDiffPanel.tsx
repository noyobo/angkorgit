import { useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { X } from 'lucide-react';
import type { CommitFileInfo, FileDiff } from '@angkorgit/core';
import { filterFiles } from '@angkorgit/core';
import {
  Badge,
  Button,
  Hint,
  Kbd,
  Spinner,
  cn,
} from '@angkorgit/design-system';
import { ipc } from '@/core/ipc';
import { FileFilterInput } from '@/components/FileFilterInput';
import { useRepo } from '@/features/repository/store';
import { useUi } from '@/features/ui/store';
import { useGraph } from '@/features/graph/store';
import {
  FileTree,
  INITIAL_FOLD,
  nextFold,
  treeIndent,
  type FileTreeFold,
} from '@/components/FileTree';
import { basename, dirname } from '@/shared/utils';

const diffPath = (diff: CommitFileInfo) => diff.path;

const VIRTUAL_FILE_THRESHOLD = 200;
const FILE_ROW_HEIGHT = 34;

const statusMeta: Record<
  CommitFileInfo['status'],
  { label: string; mark: string; className: string; tone: 'info' | 'success' | 'danger' | 'primary' }
> = {
  modified: { label: 'modified', mark: 'M', className: 'text-info', tone: 'info' },
  new: { label: 'added', mark: 'A', className: 'text-success', tone: 'success' },
  deleted: { label: 'deleted', mark: 'D', className: 'text-danger', tone: 'danger' },
  renamed: { label: 'renamed', mark: 'R', className: 'text-primary', tone: 'primary' },
};

function ChangeSummary({ diffs }: { diffs: CommitFileInfo[] }) {
  if (diffs.length === 0) return <>No changes</>;
  const order: CommitFileInfo['status'][] = ['modified', 'new', 'deleted', 'renamed'];
  const parts = order
    .map((status) => ({ status, count: diffs.filter((d) => d.status === status).length }))
    .filter((p) => p.count > 0);
  return (
    <span className="flex items-center gap-x-2.5 whitespace-nowrap">
      {parts.map(({ status, count }) => (
        <span
          key={status}
          title={`${count} ${statusMeta[status].label}`}
          aria-label={`${count} ${statusMeta[status].label}`}
          className={cn('flex items-center gap-1 tabular-nums', statusMeta[status].className)}
        >
          <span className="font-mono">{statusMeta[status].mark}</span>
          {count}
        </span>
      ))}
    </span>
  );
}

function VirtualFileRows({
  diffs,
  scrollRef,
  renderRow,
}: {
  diffs: CommitFileInfo[];
  scrollRef: React.RefObject<HTMLDivElement>;
  renderRow: (diff: CommitFileInfo) => React.ReactNode;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: diffs.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => FILE_ROW_HEIGHT,
    scrollMargin: 0,
    overscan: 10,
  });

  return (
    <div ref={listRef} style={{ height: virtualizer.getTotalSize() }}>
      {virtualizer.getVirtualItems().map((item) => (
        <div
          key={item.key}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${item.size}px`,
            transform: `translateY(${item.start}px)`,
          }}
        >
          {renderRow(diffs[item.index])}
        </div>
      ))}
    </div>
  );
}

interface RangeDiffPanelProps {
  fromOid: string;
  toOid: string;
  fromLabel?: string;
  toLabel?: string;
}

export function RangeDiffPanel({ fromOid, toOid, fromLabel, toLabel }: RangeDiffPanelProps) {
  const repo = useRepo((s) => s.repo);
  const commits = useGraph((s) => s.commits);
  const fileTree = useUi((s) => s.fileTree);
  const openCenterDiff = useUi((s) => s.openCenterDiff);
  const closeRangeDiff = useUi((s) => s.closeRangeDiff);
  
  const [diffs, setDiffs] = useState<FileDiff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [fold, setFold] = useState<FileTreeFold>(INITIAL_FOLD);

  const path = repo?.path ?? '';

  const fromCommit = useMemo(() => commits.find((c) => c.oid === fromOid), [commits, fromOid]);
  const toCommit = useMemo(() => commits.find((c) => c.oid === toOid), [commits, toOid]);

  useEffect(() => {
    if (!path || !fromOid || !toOid) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void ipc
      .rangeDiff(path, fromOid, toOid)
      .then((result) => {
        if (!cancelled) {
          setDiffs(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(String((err as { message?: string }).message ?? err));
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [path, fromOid, toOid]);

  const fileInfo = useMemo(
    (): CommitFileInfo[] =>
      diffs.map((d) => ({
        path: d.path,
        oldPath: d.oldPath ?? null,
        status: d.status as CommitFileInfo['status'],
        additions: d.additions,
        deletions: d.deletions,
        isBinary: d.isBinary,
        isImage: d.isImage,
        sourceOid: undefined,
      })),
    [diffs],
  );

  const filtered = useMemo(() => filterFiles(fileInfo, diffPath, filter), [fileInfo, filter]);

  const scrollRef = useRef<HTMLDivElement>(null);

  const renderRow = (diff: CommitFileInfo) => {
    const meta = statusMeta[diff.status];
    return (
      <button
        key={diff.path}
        className="flex h-[34px] w-full items-center gap-1.5 border-b border-border-subtle px-3 text-left text-xs hover:bg-surface-raised"
        onClick={() => {
          openCenterDiff({
            path: diff.path,
            fromOid,
            toOid,
            oldPath: diff.oldPath,
          });
        }}
      >
        <Badge tone={meta.tone} className="shrink-0 font-mono text-[10px]">
          {meta.mark}
        </Badge>
        <span className="max-w-full shrink-0 truncate font-medium">{basename(diff.path)}</span>
        <span className="min-w-0 flex-1 truncate text-faint">{dirname(diff.path)}</span>
        {!diff.oldPath && (
          <span className="shrink-0 tabular-nums text-faint">
            <span className="text-success">+{diff.additions}</span>{' '}
            <span className="text-danger">−{diff.deletions}</span>
          </span>
        )}
      </button>
    );
  };

  const renderTreeRow = (diff: CommitFileInfo, depth: number) => {
    const meta = statusMeta[diff.status];
    return (
      <button
        key={diff.path}
        className="flex h-[34px] w-full items-center gap-1.5 border-b border-border-subtle text-left text-xs hover:bg-surface-raised"
        style={{ paddingLeft: treeIndent(depth) }}
        onClick={() => {
          openCenterDiff({
            path: diff.path,
            fromOid,
            toOid,
            oldPath: diff.oldPath,
          });
        }}
      >
        <Badge tone={meta.tone} className="shrink-0 font-mono text-[10px]">
          {meta.mark}
        </Badge>
        <span className="max-w-full shrink-0 truncate font-medium">{basename(diff.path)}</span>
        <span className="min-w-0 flex-1" />
        {!diff.oldPath && (
          <span className="shrink-0 tabular-nums text-faint">
            <span className="text-success">+{diff.additions}</span>{' '}
            <span className="text-danger">−{diff.deletions}</span>
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-border-subtle bg-surface px-3">
        <span className="flex-1 select-none truncate text-sm font-medium">
          {fromLabel ?? fromCommit?.shortOid ?? fromOid.slice(0, 8)}
          {' → '}
          {toLabel ?? toCommit?.shortOid ?? toOid.slice(0, 8)}
        </span>
        <Hint
          label={
            <span className="flex items-center gap-1">
              Close <Kbd>Esc</Kbd>
            </span>
          }
        >
          <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={closeRangeDiff}>
            <X className="size-4" />
          </Button>
        </Hint>
      </div>

      {loading ? (
        <div className="flex h-full items-center justify-center">
          <Spinner className="size-5" />
        </div>
      ) : error ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6">
          <p className="max-w-md text-center text-sm text-danger [overflow-wrap:anywhere]">{error}</p>
        </div>
      ) : (
        <>
          <div className="flex h-10 shrink-0 items-center gap-2 border-b border-border-subtle px-3">
            <span className="text-xs font-medium">FILES {filtered.length}</span>
            <div className="flex-1" />
            <ChangeSummary diffs={fileInfo} />
          </div>

          {fileInfo.length > 0 && (
            <div className="flex shrink-0 items-center gap-2 border-b border-border-subtle px-3 py-1.5">
              <FileFilterInput value={filter} onChange={setFilter} onClose={() => setFilter('')} />
            </div>
          )}

          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
            {filtered.length === 0 && filter && (
              <p className="py-6 text-center text-xs text-faint">No files match</p>
            )}
            {filtered.length === 0 && !filter && (
              <p className="py-6 text-center text-xs text-faint">No changes</p>
            )}
            {filtered.length > 0 && !fileTree && filtered.length > VIRTUAL_FILE_THRESHOLD && (
              <VirtualFileRows diffs={filtered} scrollRef={scrollRef} renderRow={renderRow} />
            )}
            {filtered.length > 0 && !fileTree && filtered.length <= VIRTUAL_FILE_THRESHOLD && (
              <div>
                {filtered.map((diff) => (
                  <div key={diff.path}>{renderRow(diff)}</div>
                ))}
              </div>
            )}
            {filtered.length > 0 && fileTree && (
              <FileTree
                items={filtered}
                fold={fold}
                pathOf={(item) => item.path}
                onFoldState={(state) => {
                  if (!state.hasFolders) return;
                  setFold(nextFold(fold, state.allCollapsed ? 'expand' : 'collapse'));
                }}
                renderFile={renderTreeRow}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
