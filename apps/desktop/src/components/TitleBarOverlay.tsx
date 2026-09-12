import { Button, cn, Hint, TabStrip } from '@angkorgit/design-system';
import { FolderTree, Plus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { pickDirectory, startWindowDrag } from '@/core/ipc';
import { useRepo } from '@/features/repository/store';
import { killTerminalSession } from '@/features/terminal/sessions';
import { useUi } from '@/features/ui/store';
import { useShortcuts } from '@/shared/useShortcuts';
import { isMac } from '@/shared/utils';

const TAB_HINT_DELAY_MS = 200;
const TRAFFIC_LIGHT_INSET = 78;

function overlayBlocksTabs(): boolean {
  const ui = useUi.getState();
  return Boolean(ui.dialog || ui.paletteOpen || ui.conflictFile);
}

function terminalPanelHasFocus(): boolean {
  if (typeof document === 'undefined') return false;
  return !!document.querySelector('[data-terminal-focused="true"]');
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

export function TitleBarOverlay() {
  const repo = useRepo((s) => s.repo);
  const tabs = useUi((s) => s.repoTabs);
  const worktreeTabs = useUi((s) => s.worktreeTabs);
  const [draggingTab, setDraggingTab] = useState<string | null>(null);
  const [dropTab, setDropTab] = useState<string | null>(null);
  const [showHints, setShowHints] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null!);

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
          if (overlayBlocksTabs() || terminalPanelHasFocus()) return;
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
      if (overlayBlocksTabs() || terminalPanelHasFocus()) {
        hide();
        return;
      }
      const isMod = event.key === 'Meta' || event.key === 'Control';
      if (isMod && !event.altKey && !event.shiftKey) {
        if (timer !== undefined) return;
        timer = setTimeout(() => {
          timer = undefined;
          if (!overlayBlocksTabs() && !terminalPanelHasFocus()) setShowHints(true);
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

  if (!repo) return null;

  return (
    <div
      className={cn(
        'flex h-[38px] shrink-0 items-stretch gap-2 border-b border-border-subtle bg-surface py-[3px] pr-2',
        !isMac && 'pl-2',
      )}
      onPointerDown={startWindowDrag}
    >
      {isMac && (
        <div
          data-tauri-drag-region
          className="h-full shrink-0"
          style={{ width: TRAFFIC_LIGHT_INSET }}
        />
      )}
      <div ref={stripRef} className="min-w-0 flex-1">
        <TabStrip
          items={tabs.map((path) => ({
            id: path,
            label: label(path),
            title: worktreeTabs.includes(path) ? `${path} (worktree)` : path,
            icon: worktreeTabs.includes(path) ? <FolderTree className="size-3" /> : undefined,
          }))}
          activeId={repo?.path ?? null}
          onSelect={activate}
          onClose={close}
          showHints={showHints}
          hintContent={(index) => `${isMac ? '⌘' : 'Ctrl+'} ${index + 1}`}
          size="md"
          draggable
          onDragStart={(path, e) => {
            setDraggingTab(path);
            e.dataTransfer.setData('text/angkorgit-repo-tab', path);
            e.dataTransfer.effectAllowed = 'move';
          }}
          onDragEnd={() => {
            setDraggingTab(null);
            setDropTab(null);
          }}
          onDragOver={(path, e) => {
            if (draggingTab && draggingTab !== path) {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              setDropTab(path);
            }
          }}
          onDragLeave={(path) => setDropTab((t) => (t === path ? null : t))}
          onDrop={(path, e) => {
            e.preventDefault();
            const source = e.dataTransfer.getData('text/angkorgit-repo-tab');
            setDraggingTab(null);
            setDropTab(null);
            if (source && source !== path) useUi.getState().moveRepoTab(source, path);
          }}
          onAuxClick={(path, e) => {
            if (e.button === 1) close(path);
          }}
          onWheel={(e) => {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
              e.currentTarget.scrollLeft += e.deltaY;
            }
          }}
          draggingId={draggingTab}
          dropTargetId={dropTab}
        />
      </div>
      <Hint label="Open another repository">
        <Button
          variant="ghost"
          size="icon-sm"
          className="no-drag shrink-0 self-center"
          aria-label="Open another repository"
          onClick={addNew}
        >
          <Plus className="size-4" />
        </Button>
      </Hint>
      <div data-tauri-drag-region className="min-w-4 h-full flex-1" />
    </div>
  );
}
