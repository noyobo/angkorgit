import { useEffect } from 'react';
import { logger } from '@/core/logger';

export interface Shortcut {
  combo: string;
  handler: (event: KeyboardEvent) => void;
  allowInInput?: boolean;
  skipInInput?: boolean;
  skipWhenOverlayOpen?: boolean;
  label?: string; // For logging
}

const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);

function matches(event: KeyboardEvent, combo: string): boolean {
  const parts = combo.toLowerCase().split('+');
  const key = parts[parts.length - 1] || '+';
  const needMod = parts.includes('mod');
  const needCtrl = parts.includes('ctrl');
  const needShift = parts.includes('shift');
  const needAlt = parts.includes('alt');
  const wantMeta = needMod && isMac;
  const wantCtrl = needCtrl || (needMod && !isMac);
  if (event.metaKey !== wantMeta) return false;
  if (event.ctrlKey !== wantCtrl) return false;
  if (needShift !== event.shiftKey) return false;
  if (needAlt !== event.altKey) return false;
  const eventKey = event.key.toLowerCase();
  if (key === '=' && eventKey === '+') return true;
  if (key === '`' && (eventKey === '`' || event.code === 'Backquote')) return true;
  return eventKey === key;
}

function inEditable(event: KeyboardEvent): boolean {
  const el = event.target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
}

function hasOverlayOpen(): boolean {
  if (typeof document === 'undefined') return false;
  return !!(
    document.querySelector('[data-command-palette-open]') ||
    document.querySelector('[role="dialog"][data-state="open"]') ||
    document.querySelector('[data-panels-open]') ||
    document.querySelector('[data-recent-repos-open]')
  );
}

export function useShortcuts(shortcuts: Shortcut[]): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented && event.key === 'Escape') return;
      const overlayOpen = hasOverlayOpen();
      for (const shortcut of shortcuts) {
        if (!matches(event, shortcut.combo)) continue;
        if (overlayOpen && shortcut.skipWhenOverlayOpen !== false) continue;
        const hasModifier =
          shortcut.combo.includes('mod+') ||
          shortcut.combo.includes('alt+') ||
          shortcut.combo.includes('ctrl+');
        if (shortcut.skipInInput && inEditable(event)) continue;
        if (!hasModifier && !shortcut.allowInInput && inEditable(event)) continue;
        event.preventDefault();
        void logger.key(shortcut.combo, shortcut.label || 'handler', { overlayOpen, inEditable: inEditable(event) });
        shortcut.handler(event);
        return;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shortcuts]);
}
