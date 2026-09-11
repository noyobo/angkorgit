import { Command } from 'cmdk';
import type { ReactNode } from 'react';

interface PaletteShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  shouldFilter?: boolean;
  onSearchKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  headerIcon?: ReactNode;
  children: ReactNode;
}

/**
 * Shared palette shell for all list-style panels (⌘K, ⌘O, ⌘⇧?).
 * Provides consistent overlay, sizing, input, and list chrome.
 */
export function PaletteShell({
  open,
  onOpenChange,
  label,
  search,
  onSearchChange,
  searchPlaceholder = 'Type to filter…',
  shouldFilter = true,
  onSearchKeyDown,
  headerIcon,
  children,
}: PaletteShellProps) {
  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label={label}
      shouldFilter={shouldFilter}
      className="fixed left-1/2 top-24 z-50 w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-lg border border-border bg-surface-overlay shadow-soft"
    >
      {search !== undefined && onSearchChange !== undefined ? (
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
          {headerIcon && <div className="shrink-0 text-muted [&>svg]:size-4">{headerIcon}</div>}
          <Command.Input
            value={search}
            onValueChange={onSearchChange}
            placeholder={searchPlaceholder}
            onKeyDown={onSearchKeyDown}
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-faint"
          />
        </div>
      ) : (
        <Command.Input
          value={search ?? ''}
          onValueChange={onSearchChange ?? (() => {})}
          placeholder={searchPlaceholder}
          onKeyDown={onSearchKeyDown}
          className="h-11 w-full border-b border-border-subtle bg-transparent px-4 text-sm text-foreground outline-none placeholder:text-faint"
        />
      )}
      <Command.List className="max-h-80 overflow-y-auto p-1.5 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-faint">
        {children}
      </Command.List>
    </Command.Dialog>
  );
}

interface PaletteItemProps {
  icon: ReactNode;
  label: string;
  shortcut?: string | ReactNode;
  value?: string;
  keywords?: string[];
  active?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

/**
 * Shared palette item with icon, label, and optional kbd badge.
 */
export function PaletteItem({
  icon,
  label,
  shortcut,
  value,
  keywords,
  active,
  disabled,
  onSelect,
}: PaletteItemProps) {
  return (
    <Command.Item
      value={value}
      keywords={keywords}
      disabled={disabled}
      onSelect={onSelect}
      className="flex cursor-default select-none items-center gap-2.5 rounded-md px-2 py-2 text-sm text-foreground data-[disabled]:cursor-not-allowed data-[disabled]:text-muted data-[disabled]:data-[selected=true]:bg-surface-raised/50 data-[selected=true]:bg-surface-raised [&_svg]:size-4 [&_svg]:text-muted"
    >
      {icon}
      <span className="flex-1">{label}</span>
      {active && (
        <svg className="size-3.5 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {shortcut && <span className="shrink-0 text-muted">{shortcut}</span>}
    </Command.Item>
  );
}
