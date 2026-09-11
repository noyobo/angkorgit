import { Suspense, lazy, useEffect, useLayoutEffect, useRef } from 'react';
import { Panel, PanelGroup, PanelResizeHandle, type ImperativePanelHandle } from 'react-resizable-panels';
import { cn } from '@angkorgit/design-system';
import { CommitGraph } from '@/features/graph/CommitGraph';
import { DiffPanel } from '@/features/diff/DiffPanel';
import { EditorPanel } from '@/features/editor/EditorPanel';
import { FileHistoryPanel } from '@/features/history/FileHistoryPanel';
import { Inspector } from '@/features/inspector/Inspector';
import { Sidebar } from '@/features/sidebar/Sidebar';
import { useUi, type CenterDiffTarget } from './store';
import { workspaceView } from './workspace';

const TerminalPanel = lazy(() =>
  import('@/features/terminal/TerminalPanel').then((m) => ({ default: m.TerminalPanel })),
);

const SIDEBAR_DEFAULT_SIZE = 18;
const INSPECTOR_DEFAULT_SIZE = 28;
const INSPECTOR_MIN_SIZE = 20;
const DIFF_DOCK_DEFAULT_SIZE = 48;

function GraphPane({
  repoPath,
  covered,
  diffInCenter,
  centerDiff,
  centerEditor,
  centerFileHistory,
}: {
  repoPath: string;
  covered: boolean;
  diffInCenter: boolean;
  centerDiff: CenterDiffTarget | null;
  centerEditor: string | null;
  centerFileHistory: string | null;
}) {
  return (
    <>
      <div className={covered ? 'hidden' : 'h-full'}>
        <CommitGraph key={repoPath} />
      </div>
      {centerEditor ? (
        <EditorPanel key={centerEditor} file={centerEditor} />
      ) : diffInCenter && centerDiff ? (
        <DiffPanel target={centerDiff} />
      ) : (
        centerFileHistory && <FileHistoryPanel key={centerFileHistory} file={centerFileHistory} />
      )}
    </>
  );
}

function DiffDock({ target }: { target: CenterDiffTarget | null }) {
  if (!target) {
    return (
      <div className="flex h-full items-center justify-center bg-background px-6 text-sm text-muted">
        Select a file to preview
      </div>
    );
  }
  return <DiffPanel target={target} />;
}

function TerminalSlot() {
  return (
    <Suspense fallback={null}>
      <TerminalPanel />
    </Suspense>
  );
}

export function WorkspaceLayout({ repoPath }: { repoPath: string }) {
  const layout = useUi((s) => s.layout);
  const sidebarOpenPref = useUi((s) => s.sidebarOpen);
  const terminalOpen = useUi((s) => s.terminalOpen);
  const centerDiff = useUi((s) => s.centerDiff);
  const centerEditor = useUi((s) => s.centerEditor);
  const centerFileHistory = useUi((s) => s.centerFileHistory);
  const view = workspaceView({
    layout,
    sidebarOpen: sidebarOpenPref,
    centerDiff,
    centerEditor,
    centerFileHistory,
  });

  const showSidebarRef = useRef(view.showSidebar);
  showSidebarRef.current = view.showSidebar;
  const sidebarDragging = useRef(false);
  const sidebarPanel = useRef<ImperativePanelHandle>(null);
  const inspectorPanel = useRef<ImperativePanelHandle>(null);
  const inspectorSizeBeforeFocus = useRef<number | null>(null);

  useEffect(() => {
    const panel = sidebarPanel.current;
    if (!panel) return;
    if (view.showSidebar) {
      if (panel.isCollapsed()) panel.expand(SIDEBAR_DEFAULT_SIZE);
    } else if (!panel.isCollapsed()) {
      panel.collapse();
    }
  }, [view.showSidebar, repoPath]);

  useLayoutEffect(() => {
    const panel = inspectorPanel.current;
    if (!panel) return;
    if (view.focusMode) {
      if (!panel.isCollapsed()) {
        inspectorSizeBeforeFocus.current = panel.getSize();
        panel.collapse();
      }
    } else {
      const restore = inspectorSizeBeforeFocus.current;
      inspectorSizeBeforeFocus.current = null;
      if (restore != null && restore >= INSPECTOR_MIN_SIZE) panel.resize(restore);
    }
  }, [view.focusMode, repoPath]);

  const graph = (
    <GraphPane
      repoPath={repoPath}
      covered={view.graphCovered}
      diffInCenter={view.diffInCenter}
      centerDiff={centerDiff}
      centerEditor={centerEditor}
      centerFileHistory={centerFileHistory}
    />
  );

  if (view.layout === 'preview') {
    return (
      <div className="h-full" data-workspace-layout="preview">
        <PanelGroup direction="vertical" autoSaveId="angkorgit-preview-v1">
          <Panel minSize={30}>
            {view.showDiffDock ? (
              <PanelGroup direction="horizontal" autoSaveId="angkorgit-preview-cols-v2">
                <Panel id="graph" order={1} defaultSize={28} minSize={18}>
                  {graph}
                </Panel>
                <PanelResizeHandle className={cn('w-px bg-border-subtle', view.focusMode && 'hidden')} />
                <Panel
                  ref={inspectorPanel}
                  id="inspector"
                  order={2}
                  defaultSize={24}
                  minSize={INSPECTOR_MIN_SIZE}
                  maxSize={40}
                  collapsible={view.focusMode}
                  collapsedSize={0}
                >
                  {!view.focusMode && <Inspector />}
                </Panel>
                <PanelResizeHandle className="w-px bg-border-subtle" />
                <Panel id="diff" order={3} defaultSize={DIFF_DOCK_DEFAULT_SIZE} minSize={22}>
                  <DiffDock target={centerDiff} />
                </Panel>
              </PanelGroup>
            ) : (
              graph
            )}
          </Panel>
          {terminalOpen && (
            <>
              <PanelResizeHandle className="h-px bg-border-subtle" />
              <Panel defaultSize={30} minSize={12} maxSize={60}>
                <TerminalSlot />
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>
    );
  }

  return (
    <div className="h-full" data-workspace-layout="standard">
      <PanelGroup direction="horizontal" autoSaveId="angkorgit-main-v2">
        <Panel
          ref={sidebarPanel}
          id="sidebar"
          order={1}
          defaultSize={SIDEBAR_DEFAULT_SIZE}
          minSize={13}
          maxSize={30}
          collapsible
          collapsedSize={0}
          onCollapse={() => {
            if (sidebarDragging.current) {
              if (workspaceView(useUi.getState()).showSidebar) useUi.getState().setSidebarOpen(false);
              return;
            }
            if (showSidebarRef.current) {
              requestAnimationFrame(() => {
                const panel = sidebarPanel.current;
                if (panel && showSidebarRef.current && panel.isCollapsed()) panel.expand(SIDEBAR_DEFAULT_SIZE);
              });
            }
          }}
          onExpand={() => {
            if (!sidebarDragging.current) return;
            const ui = useUi.getState();
            const next = workspaceView(ui);
            if (!ui.sidebarOpen && next.layout === 'standard' && !next.diffInCenter && !next.focusMode) {
              ui.setSidebarOpen(true);
            }
          }}
        >
          {view.showSidebar && <Sidebar />}
        </Panel>
        <PanelResizeHandle
          className={cn('w-px bg-border-subtle', !view.showSidebar && 'hidden')}
          onDragging={(dragging) => {
            sidebarDragging.current = dragging;
          }}
        />
        <Panel id="center" order={2} defaultSize={54} minSize={30}>
          <PanelGroup direction="vertical" autoSaveId="angkorgit-center">
            <Panel minSize={30}>{graph}</Panel>
            {terminalOpen && (
              <>
                <PanelResizeHandle className="h-px bg-border-subtle" />
                <Panel defaultSize={30} minSize={12} maxSize={60}>
                  <TerminalSlot />
                </Panel>
              </>
            )}
          </PanelGroup>
        </Panel>
        <PanelResizeHandle className={cn('w-px bg-border-subtle', view.focusMode && 'hidden')} />
        <Panel
          ref={inspectorPanel}
          id="inspector"
          order={3}
          defaultSize={INSPECTOR_DEFAULT_SIZE}
          minSize={INSPECTOR_MIN_SIZE}
          maxSize={45}
          collapsible={view.focusMode}
          collapsedSize={0}
        >
          {!view.focusMode && <Inspector />}
        </Panel>
      </PanelGroup>
    </div>
  );
}
