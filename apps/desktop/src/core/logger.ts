// Comprehensive audit logging to daily files for production debugging
import { isTauri } from './ipc';

export type LogCategory = 'key' | 'click' | 'cmd' | 'stdout' | 'stderr' | 'lifecycle' | 'error';

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  category: LogCategory;
  message: string;
  meta?: Record<string, unknown>;
}

let loggerReady: Promise<void> | null = null;
let logCommand: ((entry: LogEntry) => Promise<void>) | null = null;

// Sensitive keys to redact from logs
const SENSITIVE_KEYS = ['token', 'password', 'key', 'secret', 'apiKey', 'apikey', 'authorization', 'auth'];

function sanitizeMeta(meta?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!meta) return meta;
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some(s => lowerKey.includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeMeta(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

async function initLogger() {
  if (!isTauri()) return;
  const { invoke } = await import('@tauri-apps/api/core');
  logCommand = (entry: LogEntry) => invoke('log_write', { entry });
}

if (isTauri()) {
  loggerReady = initLogger();
}

async function writeLog(level: LogEntry['level'], category: LogCategory, message: string, meta?: Record<string, unknown>) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    meta: sanitizeMeta(meta),
  };
  
  if (loggerReady) await loggerReady;
  await logCommand?.(entry);
  
  if (!isTauri()) {
    const formatted = `[${entry.timestamp}] ${level} ${category} ${message}`;
    if (level === 'ERROR') console.error(formatted, entry.meta);
    else if (level === 'WARN') console.warn(formatted, entry.meta);
    else console.log(formatted, entry.meta);
  }
}

export const logger = {
  // Keyboard shortcuts and accelerators
  async key(combo: string, handler: string, meta?: Record<string, unknown>) {
    await writeLog('INFO', 'key', `Shortcut ${combo} → ${handler}`, meta);
  },

  // UI clicks on primary actions
  async click(action: string, target: string, meta?: Record<string, unknown>) {
    await writeLog('INFO', 'click', `${action} @ ${target}`, meta);
  },

  // Command execution (IPC, git, tauri)
  async cmd(command: string, args?: Record<string, unknown>, result?: { duration?: number; status?: string }) {
    await writeLog('INFO', 'cmd', `${command}`, { args, ...result });
  },

  // Process stdout
  async stdout(source: string, output: string) {
    await writeLog('INFO', 'stdout', `${source}`, { output: output.slice(0, 10000) }); // cap at 10KB per entry
  },

  // Process stderr
  async stderr(source: string, output: string) {
    await writeLog('WARN', 'stderr', `${source}`, { output: output.slice(0, 10000) });
  },

  // Lifecycle events
  async lifecycle(event: string, meta?: Record<string, unknown>) {
    await writeLog('INFO', 'lifecycle', event, meta);
  },

  // General info
  async info(message: string, meta?: Record<string, unknown>) {
    await writeLog('INFO', 'lifecycle', message, meta);
  },

  // Warnings
  async warn(message: string, meta?: Record<string, unknown>) {
    await writeLog('WARN', 'error', message, meta);
  },

  // Errors
  async error(message: string, meta?: Record<string, unknown>) {
    await writeLog('ERROR', 'error', message, meta);
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
