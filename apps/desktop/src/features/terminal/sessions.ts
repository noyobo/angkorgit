import type { Terminal } from '@xterm/xterm';
import type { FitAddon } from '@xterm/addon-fit';
import { ipc } from '@/core/ipc';

export interface TerminalSession {
  terminal: Terminal;
  fit: FitAddon;
  container: HTMLDivElement;
  termId: number | null;
  unlisteners: Array<() => void>;
  killed: boolean;
  exited: boolean;
}

export interface TerminalTab {
  id: string;
  session: TerminalSession;
  title: string;
}

let nextTabId = 1;

export function createTabId(): string {
  return `tab-${nextTabId++}`;
}

export const repoSessions = new Map<string, Map<string, TerminalTab>>();

export function getRepoTabs(repoPath: string): TerminalTab[] {
  const tabs = repoSessions.get(repoPath);
  return tabs ? Array.from(tabs.values()) : [];
}

export function getTab(repoPath: string, tabId: string): TerminalTab | undefined {
  return repoSessions.get(repoPath)?.get(tabId);
}

export function addTab(repoPath: string, tab: TerminalTab): void {
  let tabs = repoSessions.get(repoPath);
  if (!tabs) {
    tabs = new Map();
    repoSessions.set(repoPath, tabs);
  }
  tabs.set(tab.id, tab);
}

export function removeTab(repoPath: string, tabId: string): void {
  const tabs = repoSessions.get(repoPath);
  if (!tabs) return;
  const tab = tabs.get(tabId);
  if (!tab) return;
  
  tabs.delete(tabId);
  if (tabs.size === 0) {
    repoSessions.delete(repoPath);
  }
  
  const { session } = tab;
  session.killed = true;
  session.unlisteners.forEach((fn) => fn());
  if (session.termId !== null) void ipc.termKill(session.termId);
  session.terminal.dispose();
  session.container.remove();
}

export function killTerminalSession(repoPath: string): void {
  const tabs = repoSessions.get(repoPath);
  if (!tabs) return;
  
  for (const tabId of Array.from(tabs.keys())) {
    removeTab(repoPath, tabId);
  }
  repoSessions.delete(repoPath);
}
