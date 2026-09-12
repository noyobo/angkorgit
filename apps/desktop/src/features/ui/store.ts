import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { sidebarToggle, type WorkspaceLayout, workspaceView } from './workspace';

export type { WorkspaceLayout };

export type DiffViewMode = 'inline' | 'split';

export interface GraphColumns {
  refs: boolean;
  author: boolean;
  message: boolean;
  hash: boolean;
  date: boolean;
}

export const DEFAULT_GRAPH_COLUMNS: GraphColumns = {
  refs: true,
  author: true,
  message: true,
  hash: true,
  date: true,
};

export type DialogKind =
  | 'clone'
  | 'createBranch'
  | 'createTag'
  | 'createStash'
  | 'settings'
  | 'rename'
  | 'interactiveRebase'
  | 'createPullRequest'
  | 'cherryPick'
  | 'createWorktree'
  | null;

export interface CenterDiffTarget {
  path: string;
  staged?: boolean;
  oid?: string;
  oldPath?: string | null;
  fromOid?: string;
  toOid?: string;
}

export interface RangeDiffTarget {
  fromOid: string;
  toOid: string;
  fromLabel?: string;
  toLabel?: string;
}

export interface InteractiveRebasePreset {
  baseOid: string;
  squashOids?: string[];
  dropOids?: string[];
}

export interface CherryPickPreset {
  oids: string[];
}

export interface CreateWorktreePreset {
  branch?: string;
  oid?: string;
}

export interface StashPreset {
  paths: string[];
}

export interface BlameTarget {
  file: string;
  rev: string | null;
}

export interface ClonePreset {
  url: string;
  into: string;
  branch?: string;
}

export type DialogContext =
  | string
  | InteractiveRebasePreset
  | CherryPickPreset
  | CreateWorktreePreset
  | StashPreset
  | ClonePreset
  | null;

interface UiState {
  layout: WorkspaceLayout;
  sidebarOpen: boolean;
  terminalOpen: boolean;
  paletteOpen: boolean;
  recentReposOpen: boolean;
  branchSwitcherOpen: boolean;
  panelsOpen: boolean;
  dialog: DialogKind;
  dialogContext: DialogContext;
  diffView: DiffViewMode;
  wordDiff: boolean;
  fullFileDiff: boolean;
  wrapLines: boolean;
  selectedFile: { path: string; staged: boolean } | null;
  centerDiff: CenterDiffTarget | null;
  rangeDiff: RangeDiffTarget | null;
  centerEditor: string | null;
  centerFileHistory: string | null;
  centerBlame: BlameTarget | null;
  conflictFile: string | null;
  repoTabs: string[];
  worktreeTabs: string[];
  fileTree: boolean;
  fileFilterOpen: boolean;
  fileFilterFocusSeq: number;
  inspectorFocusSeq: number;
  graphFocusSeq: number;
  commitSummaryFocusSeq: number;
  sidebarSections: Record<string, boolean>;
  sidebarCollapseEpoch: number;
  commitBoxHeight: number | null;
  graphColumns: GraphColumns;
  graphTail: boolean;

  setLayout: (layout: WorkspaceLayout) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleTerminal: () => void;
  setPaletteOpen: (open: boolean) => void;
  setRecentReposOpen: (open: boolean) => void;
  setBranchSwitcherOpen: (open: boolean) => void;
  setPanelsOpen: (open: boolean) => void;
  openDialog: (dialog: DialogKind, context?: DialogContext) => void;
  closeDialog: () => void;
  setDiffView: (mode: DiffViewMode) => void;
  setWordDiff: (on: boolean) => void;
  setFullFileDiff: (on: boolean) => void;
  setWrapLines: (on: boolean) => void;
  selectFile: (file: { path: string; staged: boolean } | null) => void;
  openCenterDiff: (target: CenterDiffTarget) => void;
  closeCenterDiff: () => void;
  openRangeDiff: (target: RangeDiffTarget) => void;
  closeRangeDiff: () => void;
  openEditor: (file: string) => void;
  closeEditor: () => void;
  openFileHistory: (file: string) => void;
  closeFileHistory: () => void;
  openBlame: (file: string, rev?: string | null) => void;
  closeBlame: () => void;
  openConflict: (file: string | null) => void;
  addRepoTab: (path: string) => void;
  closeRepoTab: (path: string) => void;
  closeAllTabs: () => void;
  moveRepoTab: (from: string, to: string) => void;
  markWorktreeTab: (path: string, isWorktree: boolean) => void;
  setSidebarSection: (id: string, open: boolean) => void;
  collapseSidebarSections: (ids: readonly string[]) => void;
  setCommitBoxHeight: (height: number | null) => void;
  setGraphColumn: (column: keyof GraphColumns, on: boolean) => void;
  setGraphTail: (on: boolean) => void;
  setFileTree: (on: boolean) => void;
  setFileFilterOpen: (on: boolean) => void;
  focusInspector: () => void;
  focusGraph: () => void;
  focusCommitSummary: () => void;
}

export const sidebarVisible = (s: UiState) => workspaceView(s).showSidebar;

export const focusRequests = { inspectorConsumed: 0, commitSummaryConsumed: 0 };

let dialogReturnFocus: HTMLElement | null = null;

const captureDialogFocus = () => {
  const active = document.activeElement;
  dialogReturnFocus = active instanceof HTMLElement ? active : null;
};

const restoreDialogFocus = () => {
  const target = dialogReturnFocus;
  dialogReturnFocus = null;
  if (target && document.contains(target)) {
    requestAnimationFrame(() => target.focus());
  }
};

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      layout: 'standard',
      sidebarOpen: true,
      terminalOpen: false,
      paletteOpen: false,
      recentReposOpen: false,
      branchSwitcherOpen: false,
      panelsOpen: false,
      dialog: null,
      dialogContext: null,
      diffView: 'inline',
      wordDiff: true,
      fullFileDiff: false,
      wrapLines: false,
      selectedFile: null,
      centerDiff: null,
      rangeDiff: null,
      centerEditor: null,
      centerFileHistory: null,
      centerBlame: null,
      conflictFile: null,
      repoTabs: [],
      worktreeTabs: [],
      fileTree: false,
      fileFilterOpen: false,
      fileFilterFocusSeq: 0,
      inspectorFocusSeq: 0,
      graphFocusSeq: 0,
      commitSummaryFocusSeq: 0,
      sidebarSections: {},
      sidebarCollapseEpoch: 0,
      commitBoxHeight: null,
      graphColumns: DEFAULT_GRAPH_COLUMNS,
      graphTail: true,

      setLayout: (layout) => set({ layout }),
      toggleSidebar: () => set((s) => sidebarToggle(s)),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleTerminal: () => set((s) => ({ terminalOpen: !s.terminalOpen })),
      setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
      setRecentReposOpen: (recentReposOpen) => set({ recentReposOpen }),
      setBranchSwitcherOpen: (branchSwitcherOpen) => set({ branchSwitcherOpen }),
      setPanelsOpen: (panelsOpen) => set({ panelsOpen }),
      openDialog: (dialog, context = null) => {
        captureDialogFocus();
        set({ dialog, dialogContext: context });
      },
      closeDialog: () => {
        set({ dialog: null, dialogContext: null });
        restoreDialogFocus();
      },
      setDiffView: (diffView) => set({ diffView }),
      setWordDiff: (wordDiff) => set({ wordDiff }),
      setFullFileDiff: (fullFileDiff) => set({ fullFileDiff }),
      setWrapLines: (wrapLines) => set({ wrapLines }),
      selectFile: (selectedFile) => set({ selectedFile }),
      openCenterDiff: (centerDiff) => set({ centerDiff, rangeDiff: null }),
      closeCenterDiff: () => set({ centerDiff: null }),
      openRangeDiff: (rangeDiff) => set({ rangeDiff, centerDiff: null }),
      closeRangeDiff: () => set({ rangeDiff: null }),
      openEditor: (centerEditor) => set({ centerEditor }),
      closeEditor: () => set({ centerEditor: null }),
      openFileHistory: (centerFileHistory) => set({ centerFileHistory, centerDiff: null }),
      closeFileHistory: () => set({ centerFileHistory: null }),
      openConflict: (conflictFile) => set({ conflictFile }),
      addRepoTab: (path) =>
        set((s) => (s.repoTabs.includes(path) ? s : { repoTabs: [...s.repoTabs, path] })),
      closeRepoTab: (path) =>
        set((s) => ({
          repoTabs: s.repoTabs.filter((t) => t !== path),
          worktreeTabs: s.worktreeTabs.filter((t) => t !== path),
        })),
      closeAllTabs: () =>
        set({
          repoTabs: [],
          worktreeTabs: [],
        }),
      moveRepoTab: (from, to) =>
        set((s) => {
          const fromIdx = s.repoTabs.indexOf(from);
          const toIdx = s.repoTabs.indexOf(to);
          if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return s;
          const repoTabs = [...s.repoTabs];
          repoTabs.splice(fromIdx, 1);
          repoTabs.splice(toIdx, 0, from);
          return { repoTabs };
        }),
      markWorktreeTab: (path, isWorktree) =>
        set((s) => {
          const has = s.worktreeTabs.includes(path);
          if (has === isWorktree) return s;
          return {
            worktreeTabs: isWorktree
              ? [...s.worktreeTabs, path]
              : s.worktreeTabs.filter((t) => t !== path),
          };
        }),
      setSidebarSection: (id, open) =>
        set((s) =>
          s.sidebarSections[id] === open
            ? s
            : { sidebarSections: { ...s.sidebarSections, [id]: open } },
        ),
      collapseSidebarSections: (ids) =>
        set((s) => ({
          sidebarSections: {
            ...s.sidebarSections,
            ...Object.fromEntries(ids.map((id) => [id, false])),
          },
          sidebarCollapseEpoch: s.sidebarCollapseEpoch + 1,
        })),
      setCommitBoxHeight: (commitBoxHeight) => set({ commitBoxHeight }),
      setGraphColumn: (column, on) =>
        set((s) => ({ graphColumns: { ...s.graphColumns, [column]: on } })),
      setGraphTail: (graphTail) => set({ graphTail }),
      setFileTree: (fileTree) => set({ fileTree }),
      setFileFilterOpen: (on) =>
        set((s) => ({
          fileFilterOpen: on,
          fileFilterFocusSeq: on ? s.fileFilterFocusSeq + 1 : s.fileFilterFocusSeq,
        })),
      focusInspector: () => set((s) => ({ inspectorFocusSeq: s.inspectorFocusSeq + 1 })),
      focusGraph: () => set((s) => ({ graphFocusSeq: s.graphFocusSeq + 1 })),
      focusCommitSummary: () =>
        set((s) => ({ commitSummaryFocusSeq: s.commitSummaryFocusSeq + 1 })),
    }),
    {
      name: 'angkorgit-ui',
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<UiState>;
        return {
          ...current,
          ...saved,
          layout: saved.layout === 'preview' ? 'preview' : 'standard',
          graphColumns: { ...DEFAULT_GRAPH_COLUMNS, ...(saved.graphColumns ?? {}) },
        };
      },
      partialize: (state) => ({
        layout: state.layout,
        sidebarOpen: state.sidebarOpen,
        diffView: state.diffView,
        wordDiff: state.wordDiff,
        fullFileDiff: state.fullFileDiff,
        wrapLines: state.wrapLines,
        repoTabs: state.repoTabs,
        worktreeTabs: state.worktreeTabs,
        fileTree: state.fileTree,
        sidebarSections: state.sidebarSections,
        commitBoxHeight: state.commitBoxHeight,
        graphColumns: state.graphColumns,
        graphTail: state.graphTail,
      }),
    },
  ),
);
