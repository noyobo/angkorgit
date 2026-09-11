import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { FolderTree, Plus, X } from 'lucide-react';
import { Button, Hint, cn } from '@angkorgit/design-system';
import { pickDirectory } from '@/core/ipc';
import { useRepo } from '@/features/repository/store';
import { killTerminalSession } from '@/features/terminal/sessions';
import { useUi } from '@/features/ui/store';
import { useShortcuts } from '@/shared/useShortcuts';
import { modKey } from '@/shared/utils';

const TAB_HINT_DELAY_MS = 200;

function overlayBlocksTabs(): boolean {
  const ui = useUi.getState();
  return Boolean(ui.dialog || ui.paletteOpen || ui.conflictFile);
}

function activate(path: string) {
  if (path === useRepo.getState().repo?.path) return;
  void useRepo
    .getState()
    .open(path)
    .catch((error) => {
      toast.error(`Could not open: ${(error as { message?: string }).message ?? error}`);
      useUi.getState().closeRepoTab(path);
      killTerminalSession(path);
    });
}

export function RepoTabs() {
  const repo = useRepo((s) => s.repo);
  const tabs = useUi((s) => s.repoTabs);
  const worktreeTabs = useUi((s) => s.worktreeTabs);
  const [draggingTab, setDraggingTab] = useState<string | null>(null);
  const [dropTab, setDropTab] = useState<string | null>(null);
  const [showHints, setShowHints] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);

  const activePath = repo?.path ?? null;
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip || !activePath) return;
    strip
      .querySelector(`[data-tab-path="${CSS.escape(activePath)}"]`)
      ?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  }, [activePath, tabs]);

  const tabShortcuts = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        combo: `mod+${i + 1}`,
        handler: () => {
          if (overlayBlocksTabs()) return;
          const path = useUi.getState().repoTabs[i];
          if (path) activate(path);
        },
      })),
    [],
  );
  useShortcuts(tabShortcuts);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const hide = () => {
      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
      }
      setShowHints(false);
    };
    const onDown = (event: KeyboardEvent) => {
      if (overlayBlocksTabs()) {
        hide();
        return;
      }
      const isMod = event.key === 'Meta' || event.key === 'Control';
      if (isMod && !event.altKey && !event.shiftKey) {
        if (timer !== undefined) return;
        timer = setTimeout(() => {
          timer = undefined;
          if (!overlayBlocksTabs()) setShowHints(true);
        }, TAB_HINT_DELAY_MS);
        return;
      }
      hide();
    };
    const onUp = (event: KeyboardEvent) => {
      if (event.key === 'Meta' || event.key === 'Control') hide();
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', hide);
    return () => {
      hide();
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', hide);
    };
  }, []);

  const close = (path: string) => {
    const remaining = tabs.filter((t) => t !== path);
    useUi.getState().closeRepoTab(path);
    killTerminalSession(path);
    if (repo?.path !== path) return;
    if (remaining.length > 0) activate(remaining[remaining.length - 1]);
    else useRepo.getState().close();
  };

  const addNew = () => {
    void (async () => {
      const dir = await pickDirectory('Open a repository');
      if (!dir) return;
      try {
        await useRepo.getState().open(dir);
      } catch (error) {
        toast.error(
          `Could not open repository: ${(error as { message?: string }).message ?? error}`,
        );
      }
    })();
  };

  const label = (path: string) => path.split(/[\\/]/).filter(Boolean).pop() ?? path;

  return (
    <div className="flex h-9 shrink-0 items-end gap-0.5 border-b border-border-subtle bg-surface px-2">
      <div
        ref={stripRef}
        className="scrollbar-none flex min-w-0 flex-1 items-end gap-0.5 overflow-x-auto"
        data-tab-hints={showHints || undefined}
        onWheel={(e) => {
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.currentTarget.scrollLeft += e.deltaY;
          }
        }}
      >
        {tabs.map((path, index) => {
          const active = path === repo?.path;
          return (
            <div
              key={path}
              role="tab"
              aria-selected={active}
              data-tab-path={path}
              title={worktreeTabs.includes(path) ? `${path} (worktree)` : path}
              draggable
              onDragStart={(e) => {
                setDraggingTab(path);
                e.dataTransfer.setData('text/angkorgit-repo-tab', path);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragEnd={() => {
                setDraggingTab(null);
                setDropTab(null);
              }}
              onDragOver={(e) => {
                if (draggingTab && draggingTab !== path) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setDropTab(path);
                }
              }}
              onDragLeave={() => setDropTab((t) => (t === path ? null : t))}
              onDrop={(e) => {
                e.preventDefault();
                const source = e.dataTransfer.getData('text/angkorgit-repo-tab');
                setDraggingTab(null);
                setDropTab(null);
                if (source && source !== path) useUi.getState().moveRepoTab(source, path);
              }}
              onClick={() => activate(path)}
              onAuxClick={(e) => {
                if (e.button === 1) close(path);
              }}
              className={cn(
                'group relative flex h-8 min-w-0 max-w-44 shrink-0 cursor-default items-center gap-1.5 overflow-hidden rounded-t-md border border-b-0 px-3 text-xs',
                active
                  ? 'border-border-subtle bg-background text-foreground'
                  : 'border-transparent text-muted hover:bg-surface-raised hover:text-foreground',
                draggingTab === path && 'opacity-40',
                dropTab === path && 'ring-1 ring-inset ring-primary/60',
              )}
            >
              {index < 9 && (
                <span
                  aria-hidden
                  className={cn(
                    'pointer-events-none absolute inset-y-0 left-0 z-[1] flex items-center whitespace-nowrap rounded-tl-md bg-gradient-to-r to-transparent pl-2.5 pr-7 text-[11px] font-medium tabular-nums text-primary transition-opacity duration-150',
                    active ? 'from-background from-[45%]' : 'from-surface from-[45%]',
                    showHints ? 'opacity-100' : 'opacity-0',
                  )}
                >
                  {modKey()} {index + 1}
                </span>
              )}
              {worktreeTabs.includes(path) && (
                <FolderTree
                  className={cn('size-3 shrink-0', active ? 'text-primary' : 'text-faint')}
                  aria-label="Worktree"
                />
              )}
              <span className="min-w-0 truncate">{label(path)}</span>
              <button
                type="button"
                aria-label={`Close ${label(path)}`}
                className={cn(
                  'relative z-[2] shrink-0 rounded-sm p-0.5 hover:bg-surface-overlay hover:text-foreground',
                  active ? 'text-muted' : 'text-transparent group-hover:text-muted',
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  close(path);
                }}
              >
                <X className="size-3" />
              </button>
            </div>
          );
        })}
      </div>
      <Hint label="Open another repository">
        <Button
          variant="ghost"
          size="icon-sm"
          className="mb-0.5 shrink-0"
          aria-label="Open another repository"
          onClick={addNew}
        >
          <Plus className="size-4" />
        </Button>
      </Hint>
    </div>
  );
}
