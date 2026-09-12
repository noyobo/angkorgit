import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface TabStripItem<T = string> {
  id: T;
  label: string;
  icon?: ReactNode;
  title?: string;
}

export interface TabStripProps<T = string> {
  items: TabStripItem<T>[];
  activeId: T | null;
  onSelect: (id: T) => void;
  onClose: (id: T) => void;
  showHints?: boolean;
  hintContent?: (index: number) => string;
  size?: 'sm' | 'md';
  className?: string;
  onWheel?: (e: React.WheelEvent<HTMLDivElement>) => void;
  renderExtraContent?: (item: TabStripItem<T>, index: number) => ReactNode;
  maxTabWidth?: string;
  draggable?: boolean;
  onDragStart?: (id: T, e: React.DragEvent) => void;
  onDragEnd?: () => void;
  onDragOver?: (id: T, e: React.DragEvent) => void;
  onDragLeave?: (id: T) => void;
  onDrop?: (targetId: T, e: React.DragEvent) => void;
  onAuxClick?: (id: T, e: React.MouseEvent) => void;
  draggingId?: T | null;
  dropTargetId?: T | null;
}

export function TabStrip<T extends string>({
  items,
  activeId,
  onSelect,
  onClose,
  showHints = false,
  hintContent,
  size = 'md',
  className,
  onWheel,
  renderExtraContent,
  maxTabWidth = size === 'sm' ? 'max-w-32' : 'max-w-44',
  draggable = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onAuxClick,
  draggingId,
  dropTargetId,
}: TabStripProps<T>) {
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';
  const hintSize = size === 'sm' ? 'text-[10px]' : 'text-[11px]';
  const iconSize = size === 'sm' ? 'size-2.5' : 'size-3';
  const padding = size === 'sm' ? 'px-2' : 'px-2.5';
  const hintPadding = size === 'sm' ? 'pl-1.5 pr-6' : 'pl-2 pr-7';
  const defaultHintContent = (index: number) => `⌘ ${index + 1}`;

  return (
    <div
      className={cn('scrollbar-none flex min-w-0 items-stretch gap-0.5 overflow-x-auto', className)}
      data-tab-hints={showHints || undefined}
      onWheel={onWheel}
    >
      {items.map((item, index) => {
        const active = item.id === activeId;
        return (
          <div
            key={item.id}
            role="tab"
            aria-selected={active}
            title={item.title}
            draggable={draggable}
            onDragStart={(e) => onDragStart?.(item.id, e)}
            onDragEnd={onDragEnd}
            onDragOver={(e) => onDragOver?.(item.id, e)}
            onDragLeave={() => onDragLeave?.(item.id)}
            onDrop={(e) => onDrop?.(item.id, e)}
            onClick={() => onSelect(item.id)}
            onAuxClick={(e) => onAuxClick?.(item.id, e)}
            className={cn(
              'group relative flex h-full min-w-0 shrink-0 cursor-default items-center gap-1.5 overflow-hidden rounded-md',
              textSize,
              padding,
              maxTabWidth,
              active
                ? 'bg-surface-raised text-foreground'
                : 'text-muted hover:bg-surface-raised/70 hover:text-foreground',
              draggingId === item.id && 'opacity-40',
              dropTargetId === item.id && 'ring-1 ring-inset ring-primary/60',
            )}
          >
            {index < 9 && (
              <span
                aria-hidden
                className={cn(
                  'pointer-events-none absolute inset-y-0 left-0 z-[1] flex items-center whitespace-nowrap rounded-md bg-gradient-to-r from-surface-raised from-[45%] to-transparent font-medium tabular-nums text-primary transition-opacity duration-150',
                  !active && 'from-surface',
                  showHints ? 'opacity-100' : 'opacity-0',
                  hintSize,
                  hintPadding,
                )}
              >
                {hintContent ? hintContent(index) : defaultHintContent(index)}
              </span>
            )}
            {item.icon && (
              <div className={cn('shrink-0', active ? 'text-primary' : 'text-faint')}>
                {item.icon}
              </div>
            )}
            <span className="min-w-0 select-none truncate">{item.label}</span>
            {renderExtraContent?.(item, index)}
            <button
              type="button"
              aria-label={`Close ${item.label}`}
              className={cn(
                'relative z-[2] shrink-0 rounded-sm p-0.5 hover:bg-surface-overlay hover:text-foreground',
                active ? 'text-muted' : 'text-transparent group-hover:text-muted',
              )}
              onClick={(e) => {
                e.stopPropagation();
                onClose(item.id);
              }}
            >
              <X className={iconSize} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
