import { describe, expect, it } from 'vitest';
import { sidebarToggle, workspaceView, type WorkspaceInput } from '../../apps/desktop/src/features/ui/workspace';

const base: WorkspaceInput = {
  layout: 'standard',
  sidebarOpen: true,
  centerDiff: null,
  centerEditor: null,
  centerFileHistory: null,
};

describe('workspace view', () => {
  it('keeps the standard three panes when nothing is open', () => {
    expect(workspaceView(base)).toMatchObject({
      showSidebar: true,
      graphCovered: false,
      diffInCenter: false,
      showDiffDock: false,
    });
  });

  it('covers the graph with an immersive diff in standard layout', () => {
    expect(workspaceView({ ...base, centerDiff: { path: 'a.ts' } })).toMatchObject({
      showSidebar: false,
      graphCovered: true,
      diffInCenter: true,
      showDiffDock: false,
    });
  });

  it('docks the diff beside the graph in preview', () => {
    expect(workspaceView({ ...base, layout: 'preview', centerDiff: { path: 'a.ts' } })).toMatchObject({
      showSidebar: false,
      graphCovered: false,
      diffInCenter: false,
      showDiffDock: true,
    });
  });

  it('still shows the empty diff dock in preview with no file', () => {
    expect(workspaceView({ ...base, layout: 'preview' })).toMatchObject({
      showSidebar: false,
      graphCovered: false,
      showDiffDock: true,
    });
  });

  it('ignores sidebarOpen in preview', () => {
    expect(workspaceView({ ...base, layout: 'preview', sidebarOpen: true }).showSidebar).toBe(false);
  });

  it('covers the graph for the editor and file history in both layouts', () => {
    expect(workspaceView({ ...base, centerEditor: 'a.ts' }).graphCovered).toBe(true);
    expect(workspaceView({ ...base, layout: 'preview', centerEditor: 'a.ts' })).toMatchObject({
      graphCovered: true,
      showDiffDock: false,
    });
    expect(workspaceView({ ...base, centerFileHistory: 'a.ts' })).toMatchObject({
      showSidebar: false,
      graphCovered: true,
      focusMode: true,
    });
  });
});

describe('sidebar toggle', () => {
  it('leaves preview and clears the diff so the sidebar can actually show', () => {
    expect(sidebarToggle({ layout: 'preview', sidebarOpen: false, centerDiff: { path: 'a.ts' } })).toEqual({
      layout: 'standard',
      sidebarOpen: true,
      centerDiff: null,
    });
  });

  it('closes an immersive diff and shows the sidebar', () => {
    expect(sidebarToggle({ layout: 'standard', sidebarOpen: true, centerDiff: { path: 'a.ts' } })).toEqual({
      centerDiff: null,
      sidebarOpen: true,
    });
  });

  it('otherwise flips the persisted sidebar preference', () => {
    expect(sidebarToggle({ layout: 'standard', sidebarOpen: true, centerDiff: null })).toEqual({
      sidebarOpen: false,
    });
  });
});
