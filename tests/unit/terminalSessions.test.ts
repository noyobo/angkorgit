import { beforeEach, describe, expect, it, mock } from 'bun:test';
import {
  addTab,
  createTabId,
  getRepoTabs,
  getTab,
  killTerminalSession,
  removeTab,
  repoSessions,
  type TerminalSession,
  type TerminalTab,
} from '../../apps/desktop/src/features/terminal/sessions';

// Mock IPC module
mock.module('@/core/ipc', () => ({
  ipc: {
    termKill: mock(() => Promise.resolve()),
  },
}));

function createMockSession(): TerminalSession {
  return {
    terminal: {
      dispose: mock(() => {}),
    } as any,
    fit: {} as any,
    container: {
      remove: mock(() => {}),
    } as any,
    termId: 123,
    unlisteners: [mock(() => {})],
    killed: false,
    exited: false,
  };
}

describe('terminal sessions', () => {
  beforeEach(() => {
    repoSessions.clear();
  });

  describe('createTabId', () => {
    it('creates unique tab IDs', () => {
      const id1 = createTabId();
      const id2 = createTabId();
      expect(id1).toMatch(/^tab-\d+$/);
      expect(id2).toMatch(/^tab-\d+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('addTab / getTab / getRepoTabs', () => {
    it('adds and retrieves a tab for a repo', () => {
      const repoPath = '/test/repo';
      const tab: TerminalTab = {
        id: 'tab-1',
        session: createMockSession(),
        title: 'Terminal 1',
      };

      addTab(repoPath, tab);
      expect(getTab(repoPath, 'tab-1')).toBe(tab);
      expect(getRepoTabs(repoPath)).toEqual([tab]);
    });

    it('returns empty array for repo with no tabs', () => {
      expect(getRepoTabs('/nonexistent')).toEqual([]);
    });

    it('returns undefined for non-existent tab', () => {
      expect(getTab('/test/repo', 'tab-999')).toBeUndefined();
    });

    it('supports multiple tabs per repo', () => {
      const repoPath = '/test/repo';
      const tab1: TerminalTab = {
        id: 'tab-1',
        session: createMockSession(),
        title: 'Terminal 1',
      };
      const tab2: TerminalTab = {
        id: 'tab-2',
        session: createMockSession(),
        title: 'Terminal 2',
      };

      addTab(repoPath, tab1);
      addTab(repoPath, tab2);

      const tabs = getRepoTabs(repoPath);
      expect(tabs).toHaveLength(2);
      expect(tabs).toContain(tab1);
      expect(tabs).toContain(tab2);
    });

    it('supports tabs across multiple repos', () => {
      const repo1 = '/test/repo1';
      const repo2 = '/test/repo2';
      const tab1: TerminalTab = {
        id: 'tab-1',
        session: createMockSession(),
        title: 'Terminal 1',
      };
      const tab2: TerminalTab = {
        id: 'tab-2',
        session: createMockSession(),
        title: 'Terminal 2',
      };

      addTab(repo1, tab1);
      addTab(repo2, tab2);

      expect(getRepoTabs(repo1)).toEqual([tab1]);
      expect(getRepoTabs(repo2)).toEqual([tab2]);
    });
  });

  describe('removeTab', () => {
    it('removes a tab and cleans up session', () => {
      const repoPath = '/test/repo';
      const session = createMockSession();
      const tab: TerminalTab = {
        id: 'tab-1',
        session,
        title: 'Terminal 1',
      };

      addTab(repoPath, tab);
      removeTab(repoPath, 'tab-1');

      expect(getTab(repoPath, 'tab-1')).toBeUndefined();
      expect(getRepoTabs(repoPath)).toEqual([]);
      expect(session.killed).toBe(true);
      expect(session.terminal.dispose).toHaveBeenCalled();
      expect(session.container.remove).toHaveBeenCalled();
    });

    it('calls unlisteners when removing tab', () => {
      const repoPath = '/test/repo';
      const unlisten = mock(() => {});
      const session = createMockSession();
      session.unlisteners = [unlisten];
      const tab: TerminalTab = {
        id: 'tab-1',
        session,
        title: 'Terminal 1',
      };

      addTab(repoPath, tab);
      removeTab(repoPath, 'tab-1');

      expect(unlisten).toHaveBeenCalled();
    });

    it('removes repo entry when last tab is removed', () => {
      const repoPath = '/test/repo';
      const tab: TerminalTab = {
        id: 'tab-1',
        session: createMockSession(),
        title: 'Terminal 1',
      };

      addTab(repoPath, tab);
      expect(repoSessions.has(repoPath)).toBe(true);

      removeTab(repoPath, 'tab-1');
      expect(repoSessions.has(repoPath)).toBe(false);
    });

    it('keeps repo entry when other tabs remain', () => {
      const repoPath = '/test/repo';
      const tab1: TerminalTab = {
        id: 'tab-1',
        session: createMockSession(),
        title: 'Terminal 1',
      };
      const tab2: TerminalTab = {
        id: 'tab-2',
        session: createMockSession(),
        title: 'Terminal 2',
      };

      addTab(repoPath, tab1);
      addTab(repoPath, tab2);
      removeTab(repoPath, 'tab-1');

      expect(repoSessions.has(repoPath)).toBe(true);
      expect(getRepoTabs(repoPath)).toEqual([tab2]);
    });

    it('does nothing when tab does not exist', () => {
      const repoPath = '/test/repo';
      expect(() => removeTab(repoPath, 'nonexistent')).not.toThrow();
    });

    it('does nothing when repo does not exist', () => {
      expect(() => removeTab('/nonexistent', 'tab-1')).not.toThrow();
    });
  });

  describe('killTerminalSession', () => {
    it('removes all tabs for a repo', () => {
      const repoPath = '/test/repo';
      const session1 = createMockSession();
      const session2 = createMockSession();
      const tab1: TerminalTab = {
        id: 'tab-1',
        session: session1,
        title: 'Terminal 1',
      };
      const tab2: TerminalTab = {
        id: 'tab-2',
        session: session2,
        title: 'Terminal 2',
      };

      addTab(repoPath, tab1);
      addTab(repoPath, tab2);

      killTerminalSession(repoPath);

      expect(getRepoTabs(repoPath)).toEqual([]);
      expect(repoSessions.has(repoPath)).toBe(false);
      expect(session1.killed).toBe(true);
      expect(session2.killed).toBe(true);
      expect(session1.terminal.dispose).toHaveBeenCalled();
      expect(session2.terminal.dispose).toHaveBeenCalled();
    });

    it('does nothing when repo has no tabs', () => {
      expect(() => killTerminalSession('/nonexistent')).not.toThrow();
    });

    it('only affects specified repo', () => {
      const repo1 = '/test/repo1';
      const repo2 = '/test/repo2';
      const tab1: TerminalTab = {
        id: 'tab-1',
        session: createMockSession(),
        title: 'Terminal 1',
      };
      const tab2: TerminalTab = {
        id: 'tab-2',
        session: createMockSession(),
        title: 'Terminal 2',
      };

      addTab(repo1, tab1);
      addTab(repo2, tab2);

      killTerminalSession(repo1);

      expect(getRepoTabs(repo1)).toEqual([]);
      expect(getRepoTabs(repo2)).toEqual([tab2]);
    });
  });
});
