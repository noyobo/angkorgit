import { useEffect, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button, cn, Hint } from '@angkorgit/design-system';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { ipc, isTauri, listen } from '@/core/ipc';
import { useRepo } from '@/features/repository/store';
import { useSettings } from '@/features/settings/store';
import { useUi } from '@/features/ui/store';
import { useShortcuts } from '@/shared/useShortcuts';
import { modKey } from '@/shared/utils';
import {
  addTab,
  createTabId,
  getRepoTabs,
  getTab,
  removeTab,
  type TerminalSession,
  type TerminalTab,
} from './sessions';
import { terminalThemeFromTokens } from './theme';

function newSession(): TerminalSession {
  const container = document.createElement('div');
  container.style.width = '100%';
  container.style.height = '100%';
  const terminal = new Terminal({
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    cursorBlink: true,
    scrollback: 5000,
    theme: terminalThemeFromTokens(),
  });
  const fit = new FitAddon();
  terminal.loadAddon(fit);
  return {
    terminal,
    fit,
    container,
    termId: null,
    unlisteners: [],
    killed: false,
    exited: false,
  };
}

function spawnShell(session: TerminalSession, repoPath: string): void {
  const { terminal } = session;
  if (!isTauri()) {
    terminal.writeln('AngKorGit demo terminal — PTY available in the desktop app.');
    terminal.write('$ ');
    terminal.onData((data) => {
      if (data === '\r') terminal.write('\r\n$ ');
      else if (data === '\x7f') terminal.write('\b \b');
      else terminal.write(data);
    });
    return;
  }
  void (async () => {
    try {
      const id = await ipc.termCreate(repoPath, terminal.cols, terminal.rows);
      if (session.killed) {
        void ipc.termKill(id);
        return;
      }
      session.termId = id;
      const dataUnlisten = await listen(`term-data-${id}`, (payload) => {
        terminal.write((payload as { data: string }).data);
      });
      if (session.killed) {
        dataUnlisten();
        return;
      }
      session.unlisteners.push(dataUnlisten);
      const exitUnlisten = await listen(`term-exit-${id}`, () => {
        session.exited = true;
        terminal.writeln('\r\n[process exited]');
      });
      if (session.killed) {
        exitUnlisten();
        return;
      }
      session.unlisteners.push(exitUnlisten);
      terminal.onData((data) => void ipc.termWrite(id, data));
      terminal.onResize(({ cols, rows }) => void ipc.termResize(id, cols, rows));
    } catch (error) {
      if (session.killed) return;
      session.exited = true;
      terminal.writeln(
        `\r\n[could not start shell: ${(error as { message?: string }).message ?? error}]`,
      );
    }
  })();
}

export function TerminalPanel() {
  const repoPath = useRepo((s) => s.repo?.path ?? null);
  const toggleTerminal = useUi((s) => s.toggleTerminal);
  const theme = useSettings((s) => s.theme);
  const accent = useSettings((s) => s.accent);
  const hostRef = useRef<HTMLDivElement>(null!);
  const panelRef = useRef<HTMLDivElement>(null!);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [tabs, setTabs] = useState<TerminalTab[]>([]);
  const [showHints, setShowHints] = useState(false);

  useEffect(() => {
    const next = terminalThemeFromTokens();
    if (!repoPath) return;
    const currentTabs = getRepoTabs(repoPath);
    for (const tab of currentTabs) {
      tab.session.terminal.options.theme = next;
    }
  }, [theme, accent, repoPath]);

  const createNewTab = () => {
    if (!repoPath) return;
    const tabId = createTabId();
    const session = newSession();
    const tab: TerminalTab = {
      id: tabId,
      session,
      title: `Terminal ${getRepoTabs(repoPath).length + 1}`,
    };
    addTab(repoPath, tab);
    setActiveTabId(tabId);
    setTabs(getRepoTabs(repoPath));
  };

  const closeTab = (tabId: string) => {
    if (!repoPath) return;
    const currentTabs = getRepoTabs(repoPath);
    const tabIndex = currentTabs.findIndex((t) => t.id === tabId);
    removeTab(repoPath, tabId);
    const remaining = getRepoTabs(repoPath);
    setTabs(remaining);
    
    if (activeTabId === tabId) {
      if (remaining.length > 0) {
        const nextIndex = Math.min(tabIndex, remaining.length - 1);
        setActiveTabId(remaining[nextIndex].id);
      } else {
        setActiveTabId(null);
      }
    }
  };

  useEffect(() => {
    if (!repoPath) {
      setTabs([]);
      setActiveTabId(null);
      return;
    }

    let currentTabs = getRepoTabs(repoPath);
    if (currentTabs.length === 0) {
      createNewTab();
      currentTabs = getRepoTabs(repoPath);
    }
    
    setTabs(currentTabs);
    if (!activeTabId || !currentTabs.find((t) => t.id === activeTabId)) {
      setActiveTabId(currentTabs[0]?.id ?? null);
    }
  }, [repoPath]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !repoPath || !activeTabId) return;

    const tab = getTab(repoPath, activeTabId);
    if (!tab) return;

    const { session } = tab;
    if (session.exited) {
      closeTab(activeTabId);
      return;
    }

    const fresh = !session.container.parentElement;
    host.appendChild(session.container);

    if (fresh) {
      session.terminal.open(session.container);
      session.fit.fit();
      spawnShell(session, repoPath);
    } else {
      session.terminal.options.theme = terminalThemeFromTokens();
      session.fit.fit();
      session.terminal.focus();
    }

    const attached = session;
    const observer = new ResizeObserver(() => attached.fit.fit());
    observer.observe(host);

    return () => {
      observer.disconnect();
      attached.container.remove();
    };
  }, [repoPath, activeTabId]);

  const isFocused = () => {
    const panel = panelRef.current;
    if (!panel) return false;
    const active = document.activeElement;
    return panel.contains(active);
  };

  const tabShortcuts = Array.from({ length: 9 }, (_, i) => ({
    combo: `mod+${i + 1}`,
    handler: () => {
      if (!isFocused()) return;
      const tab = tabs[i];
      if (tab) setActiveTabId(tab.id);
    },
    label: `terminal-tab-${i + 1}`,
  }));

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
      if (!isFocused()) {
        hide();
        return;
      }
      const isMod = event.key === 'Meta' || event.key === 'Control';
      if (isMod && !event.altKey && !event.shiftKey) {
        if (timer !== undefined) return;
        timer = setTimeout(() => {
          timer = undefined;
          if (isFocused()) setShowHints(true);
        }, 200);
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
  }, [tabs, activeTabId]);

  return (
    <div ref={panelRef} className="flex h-full flex-col bg-surface" tabIndex={-1}>
      <div className="flex h-7 shrink-0 items-center border-b border-border-subtle bg-surface">
        <div className="flex min-w-0 flex-1 items-stretch gap-0.5 overflow-x-auto px-2" data-tab-hints={showHints || undefined}>
          {tabs.map((tab, index) => (
            <div
              key={tab.id}
              role="tab"
              aria-selected={tab.id === activeTabId}
              onClick={() => setActiveTabId(tab.id)}
              className={cn(
                'group relative flex h-full min-w-0 max-w-32 shrink-0 cursor-default items-center gap-1 overflow-hidden rounded-md px-2 text-[10px]',
                tab.id === activeTabId
                  ? 'bg-surface-raised text-foreground'
                  : 'text-muted hover:bg-surface-raised/70 hover:text-foreground',
              )}
            >
              {index < 9 && (
                <span
                  aria-hidden
                  className={cn(
                    'pointer-events-none absolute inset-y-0 left-0 z-[1] flex items-center whitespace-nowrap rounded-md bg-gradient-to-r from-surface-raised from-[45%] to-transparent pl-1.5 pr-6 text-[10px] font-medium tabular-nums text-primary transition-opacity duration-150',
                    tab.id !== activeTabId && 'from-surface',
                    showHints ? 'opacity-100' : 'opacity-0',
                  )}
                >
                  {modKey()} {index + 1}
                </span>
              )}
              <span className="min-w-0 select-none truncate">{tab.title}</span>
              <button
                type="button"
                aria-label={`Close ${tab.title}`}
                className={cn(
                  'relative z-[2] shrink-0 rounded-sm p-0.5 hover:bg-surface-overlay hover:text-foreground',
                  tab.id === activeTabId ? 'text-muted' : 'text-transparent group-hover:text-muted',
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
              >
                <X className="size-2.5" />
              </button>
            </div>
          ))}
          <Hint label="New terminal tab">
            <button
              type="button"
              aria-label="New terminal tab"
              className="flex h-full shrink-0 items-center rounded-md px-1.5 text-muted hover:bg-surface-raised/70 hover:text-foreground"
              onClick={createNewTab}
            >
              <Plus className="size-3" />
            </button>
          </Hint>
        </div>
        <span className="ml-2 mr-2 min-w-0 flex-shrink truncate font-mono text-[10px] text-faint">{repoPath}</span>
        <Hint label="Close terminal">
          <Button variant="ghost" size="icon-sm" className="mr-2 shrink-0" aria-label="Close terminal" onClick={toggleTerminal}>
            <X className="size-3" />
          </Button>
        </Hint>
      </div>
      <div ref={hostRef} className="terminal-host min-h-0 flex-1" />
    </div>
  );
}
