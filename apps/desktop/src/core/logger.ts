const isTauri = (): boolean => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export type LogLayer = 'ui' | 'menu' | 'ipc' | 'git' | 'rust' | 'system';
export type LogType =
  | 'key'
  | 'click'
  | 'cmd'
  | 'stdout'
  | 'stderr'
  | 'push'
  | 'lifecycle'
  | 'console';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  layer: LogLayer;
  type: LogType;
  level: LogLevel;
  message: string;
  meta?: Record<string, unknown>;
}

let loggerReady: Promise<void> | null = null;
let logCommand: ((entry: LogEntry) => Promise<void>) | null = null;

// Sensitive keys to redact from logs
const SENSITIVE_KEYS = [
  'token',
  'password',
  'key',
  'secret',
  'apiKey',
  'apikey',
  'authorization',
  'auth',
];

function sanitizeMeta(meta?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!meta) return meta;
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some((s) => lowerKey.includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeMeta(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function formatMetaAsKV(meta?: Record<string, unknown>): string {
  if (!meta) return '';
  return (
    ' ' +
    Object.entries(meta)
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join(' ')
  );
}

async function initLogger() {
  if (!isTauri()) return;
  const { invoke } = await import('@tauri-apps/api/core');
  logCommand = (entry: LogEntry) => invoke('log_write', { entry });
}

function formatConsoleArgs(args: unknown[]): string {
  return args
    .map((arg) => {
      if (arg instanceof Error)
        return `${arg.name}: ${arg.message}${arg.stack ? `\n${arg.stack}` : ''}`;
      if (typeof arg === 'string') return arg;
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
    .join(' ')
    .slice(0, 10000);
}

function captureConsole() {
  const origError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    origError(...args);
    void writeLog('ui', 'console', 'error', formatConsoleArgs(args)).catch(() => {});
  };
  window.addEventListener('error', (event) => {
    if (!(event instanceof ErrorEvent) || !event.message) return;
    void writeLog('ui', 'console', 'error', event.message, {
      filename: event.filename,
      line: event.lineno,
      col: event.colno,
      stack: event.error instanceof Error ? event.error.stack : undefined,
    }).catch(() => {});
  });
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = reason instanceof Error ? `${reason.name}: ${reason.message}` : String(reason);
    void writeLog('ui', 'console', 'error', message, {
      stack: reason instanceof Error ? reason.stack : undefined,
    }).catch(() => {});
  });
}

if (isTauri()) {
  loggerReady = initLogger();
  captureConsole();
}

async function writeLog(
  layer: LogLayer,
  type: LogType,
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>,
) {
  const entry: LogEntry = {
    layer,
    type,
    level,
    message,
    meta: sanitizeMeta(meta),
  };

  if (loggerReady) await loggerReady;
  await logCommand?.(entry);

  if (!isTauri()) {
    // Browser console format: [layer] [type] [level] message key=value
    const formatted = `[${layer}] [${type}] [${level}] ${message}${formatMetaAsKV(entry.meta)}`;
    if (level === 'error') console.error(formatted);
    else if (level === 'warn') console.warn(formatted);
    else console.log(formatted);
  }
}

export const logger = {
  // Keyboard shortcuts and accelerators
  async key(combo: string, handler: string, meta?: Record<string, unknown>) {
    await writeLog('ui', 'key', 'info', `shortcut=${combo} handler=${handler}`, meta);
  },

  // UI clicks on primary actions
  async click(action: string, target: string, meta?: Record<string, unknown>) {
    await writeLog('ui', 'click', 'info', `action=${action} target=${target}`, meta);
  },

  // Command execution (IPC, git, tauri)
  async cmd(
    command: string,
    args?: Record<string, unknown>,
    result?: { duration?: number; status?: string },
  ) {
    await writeLog('ipc', 'cmd', 'info', `command=${command}`, { args, ...result });
  },

  // Push operations (special tracking for issue #4)
  async push(attemptId: number, source: string, meta: Record<string, unknown>) {
    await writeLog('git', 'push', 'info', `attemptId=${attemptId} source=${source}`, meta);
  },

  // Process stdout
  async stdout(source: string, output: string) {
    await writeLog('git', 'stdout', 'info', `source=${source}`, { output: output.slice(0, 10000) });
  },

  // Process stderr
  async stderr(source: string, output: string) {
    await writeLog('git', 'stderr', 'warn', `source=${source}`, { output: output.slice(0, 10000) });
  },

  // Lifecycle events
  async lifecycle(event: string, meta?: Record<string, unknown>) {
    await writeLog('system', 'lifecycle', 'info', event, meta);
  },

  // General info
  async info(message: string, meta?: Record<string, unknown>) {
    await writeLog('system', 'lifecycle', 'info', message, meta);
  },

  // Warnings
  async warn(message: string, meta?: Record<string, unknown>) {
    await writeLog('system', 'lifecycle', 'warn', message, meta);
  },

  // Errors
  async error(message: string, meta?: Record<string, unknown>) {
    await writeLog('system', 'lifecycle', 'error', message, meta);
  },
};

export async function openLogsFolder(): Promise<void> {
  if (!isTauri()) {
    alert('Logs folder: browser demo mode (no logs)');
    return;
  }
  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('open_logs_folder');
}

export async function openTodayLog(): Promise<void> {
  if (!isTauri()) {
    alert('Today log: browser demo mode (no logs)');
    return;
  }
  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('open_today_log');
}
