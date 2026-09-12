import { cn } from '@angkorgit/design-system';
import { lazy, Suspense, useEffect, useLayoutEffect, useRef } from 'react';
import { Group, Panel, type PanelImperativeHandle, Separator } from 'react-resizable-panels';
import { BlamePanel } from '@/features/blame/BlamePanel';
import { DiffPanel } from '@/features/diff/DiffPanel';
import { RangeDiffPanel } from '@/features/diff/RangeDiffPanel';
import { EditorPanel } from '@/features/editor/EditorPanel';
import { CommitGraph } from '@/features/graph/CommitGraph';
import { FileHistoryPanel } from '@/features/history/FileHistoryPanel';
import { Inspector } from '@/features/inspector/Inspector';
import { Sidebar } from '@/features/sidebar/Sidebar';
import { type BlameTarget, type CenterDiffTarget, type RangeDiffTarget, useUi } from './store';
import { workspaceView } from './workspace';

const TerminalPanel = lazy(() =>
  import('@/features/terminal/TerminalPanel').then((m) => ({ default: m.TerminalPanel })),
);

// react-resizable-panels v4: numbers are px. `"28"`/`"28%"` = percent.
const SIDEBAR_DEFAULT_SIZE = '18%';
const INSPECTOR_DEFAULT_SIZE = '28%';
const INSPECTOR_MIN_SIZE = '20%';
const DIFF_DOCK_DEFAULT_SIZE = '48%';

function GraphPane({
  repoPath,
  covered,
  diffInCenter,
  centerDiff,
  rangeDiff,
  centerEditor,
  centerFileHistory,
  centerBlame,
}: {
  repoPath: string;
  covered: boolean;
  diffInCenter: boolean;
  centerDiff: CenterDiffTarget | null;
  rangeDiff: RangeDiffTarget | null;
  centerEditor: string | null;
  centerFileHistory: string | null;
  centerBlame: BlameTarget | null;
}) {
  return (
    <>
      <div className={covered ? 'hidden' : 'h-full'}>
        <CommitGraph key={repoPath} />
      </div>
      {centerEditor ? (
        <EditorPanel key={centerEditor} file={centerEditor} />
      ) : rangeDiff ? (
        <RangeDiffPanel
          fromOid={rangeDiff.fromOid}
          toOid={rangeDiff.toOid}
          fromLabel={rangeDiff.fromLabel}
          toLabel={rangeDiff.toLabel}
        />
      ) : diffInCenter && centerDiff ? (
        <DiffPanel target={centerDiff} />
      ) : centerFileHistory ? (
        <FileHistoryPanel key={centerFileHistory} file={centerFileHistory} />
      ) : (
        centerBlame && (
          <BlamePanel key={`${centerBlame.file}@${centerBlame.rev ?? ''}`} target={centerBlame} />
        )
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
  const rangeDiff = useUi((s) => s.rangeDiff);
  const centerEditor = useUi((s) => s.centerEditor);
  const centerFileHistory = useUi((s) => s.centerFileHistory);
  const centerBlame = useUi((s) => s.centerBlame);
  const view = workspaceView({
    layout,
    sidebarOpen: sidebarOpenPref,
    centerDiff,
    centerEditor,
    centerFileHistory,
    centerBlame,
  });

  const showSidebarRef = useRef(view.showSidebar);
  showSidebarRef.current = view.showSidebar;
  const sidebarPanel = useRef<PanelImperativeHandle>(null);
  const inspectorPanel = useRef<PanelImperativeHandle>(null);
  const inspectorSizeBeforeFocus = useRef<number | null>(null);

  useEffect(() => {
    const panel = sidebarPanel.current;
    if (!panel) return;
    if (view.showSidebar) {
      if (panel.isCollapsed()) panel.expand();
    } else if (!panel.isCollapsed()) {
      panel.collapse();
    }
  }, [view.showSidebar, repoPath]);

  useLayoutEffect(() => {
    const panel = inspectorPanel.current;
    if (!panel) return;
    if (view.focusMode) {
      if (!panel.isCollapsed()) {
        const size = panel.getSize();
        inspectorSizeBeforeFocus.current = size.asPercentage;
        panel.collapse();
      }
    } else if (panel.isCollapsed()) {
      panel.expand();
      inspectorSizeBeforeFocus.current = null;
    }
  }, [view.focusMode, repoPath]);

  const graph = (
    <GraphPane
      repoPath={repoPath}
      covered={view.graphCovered}
      diffInCenter={view.diffInCenter}
      centerDiff={centerDiff}
      rangeDiff={rangeDiff}
      centerEditor={centerEditor}
      centerFileHistory={centerFileHistory}
      centerBlame={centerBlame}
    />
  );

  if (view.layout === 'preview') {
    return (
      <div className="h-full" data-workspace-layout="preview">
        <Group orientation="vertical" id="angkorgit-preview-v2">
          <Panel minSize="30%">
            {view.showDiffDock ? (
              <Group orientation="horizontal" id="angkorgit-preview-cols-v3">
                <Panel id="graph" defaultSize="28%" minSize="18%">
                  {graph}
                </Panel>
                <Separator className={cn('w-px bg-border-subtle', view.focusMode && 'hidden')} />
                <Panel
                  panelRef={inspectorPanel}
                  id="inspector"
                  defaultSize="24%"
                  minSize={INSPECTOR_MIN_SIZE}
                  maxSize="40%"
                  collapsible={view.focusMode}
                  collapsedSize={0}
                >
                  {!view.focusMode && <Inspector />}
                </Panel>
                <Separator className="w-px bg-border-subtle" />
                <Panel id="diff" defaultSize={DIFF_DOCK_DEFAULT_SIZE} minSize="22%">
                  <DiffDock target={centerDiff} />
                </Panel>
              </Group>
            ) : (
              graph
            )}
          </Panel>
          {terminalOpen && (
            <>
              <Separator className="h-px bg-border-subtle" />
              <Panel defaultSize="30%" minSize="12%" maxSize="60%">
                <TerminalSlot />
              </Panel>
            </>
          )}
        </Group>
      </div>
    );
  }

  return (
    <div className="h-full" data-workspace-layout="standard">
      <Group orientation="horizontal" id="angkorgit-main-v3">
        <Panel
          panelRef={sidebarPanel}
          id="sidebar"
          defaultSize={SIDEBAR_DEFAULT_SIZE}
          minSize="13%"
          maxSize="30%"
          collapsible
          collapsedSize={0}
        >
          {view.showSidebar && <Sidebar />}
        </Panel>
        <Separator className={cn('w-px bg-border-subtle', !view.showSidebar && 'hidden')} />
        <Panel id="center" defaultSize="54%" minSize="30%">
          <Group orientation="vertical" id="angkorgit-center-v2">
            <Panel minSize="30%">{graph}</Panel>
            {terminalOpen && (
              <>
                <Separator className="h-px bg-border-subtle" />
                <Panel defaultSize="30%" minSize="12%" maxSize="60%">
                  <TerminalSlot />
                </Panel>
              </>
            )}
          </Group>
        </Panel>
        <Separator className={cn('w-px bg-border-subtle', view.focusMode && 'hidden')} />
        <Panel
          panelRef={inspectorPanel}
          id="inspector"
          defaultSize={INSPECTOR_DEFAULT_SIZE}
          minSize={INSPECTOR_MIN_SIZE}
          maxSize="45%"
          collapsible={view.focusMode}
          collapsedSize={0}
        >
          {!view.focusMode && <Inspector />}
        </Panel>
      </Group>
    </div>
  );
}
