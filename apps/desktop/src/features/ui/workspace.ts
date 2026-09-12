export type WorkspaceLayout = 'standard' | 'preview';

export interface WorkspaceInput {
  layout: WorkspaceLayout;
  sidebarOpen: boolean;
  centerDiff: unknown;
  centerEditor: unknown;
  centerFileHistory: unknown;
  centerBlame: unknown;
}

export interface WorkspaceView {
  layout: WorkspaceLayout;
  showSidebar: boolean;
  graphCovered: boolean;
  diffInCenter: boolean;
  showDiffDock: boolean;
  focusMode: boolean;
}

export function workspaceView(s: WorkspaceInput): WorkspaceView {
  const takeover = !!(s.centerEditor || s.centerFileHistory || s.centerBlame);
  const hasDiff = !!s.centerDiff;
  const preview = s.layout === 'preview';
  const focusMode = !!(s.centerFileHistory || s.centerBlame) && !s.centerEditor && !s.centerDiff;
  const diffInCenter = hasDiff && !takeover && !preview;
  const showDiffDock = preview && !takeover;
  return {
    layout: s.layout,
    showSidebar: s.sidebarOpen && !preview && !focusMode && !diffInCenter,
    graphCovered: takeover || diffInCenter,
    diffInCenter,
    showDiffDock,
    focusMode,
  };
}

export function sidebarToggle(s: {
  layout: WorkspaceLayout;
  sidebarOpen: boolean;
  centerDiff: unknown;
}):
  | { layout?: WorkspaceLayout; sidebarOpen: boolean; centerDiff: null }
  | { sidebarOpen: boolean } {
  if (s.layout === 'preview') {
    return { layout: 'standard', sidebarOpen: true, centerDiff: null };
  }
  if (s.centerDiff) {
    return { centerDiff: null, sidebarOpen: true };
  }
  return { sidebarOpen: !s.sidebarOpen };
}
