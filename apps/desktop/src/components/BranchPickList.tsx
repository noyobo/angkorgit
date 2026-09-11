import { Checkbox } from '@angkorgit/design-system';

export interface BranchPickListItem {
  name: string;
  disabled?: boolean;
  detail?: string;
  meta?: string;
}

export function BranchPickList({
  items,
  picked,
  onToggle,
}: {
  items: BranchPickListItem[];
  picked: ReadonlySet<string>;
  onToggle: (name: string, checked: boolean) => void;
}) {
  return (
    <div className="max-h-64 space-y-1 overflow-y-auto">
      {items.map((item) =>
        item.disabled ? (
          <label
            key={item.name}
            className="flex items-center gap-2 rounded-md px-1.5 py-1 text-sm text-muted"
          >
            <Checkbox checked={false} disabled aria-label={`${item.name} kept`} />
            <span className="min-w-0 flex-1 truncate font-mono text-xs">{item.name}</span>
            {item.detail && <span className="shrink-0 text-[10px] text-faint">{item.detail}</span>}
          </label>
        ) : (
          <label
            key={item.name}
            className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-surface-raised"
          >
            <Checkbox
              checked={picked.has(item.name)}
              onCheckedChange={(value) => onToggle(item.name, value === true)}
              aria-label={`Delete ${item.name}`}
            />
            <span className="min-w-0 flex-1 truncate font-mono text-xs">{item.name}</span>
            {item.meta && <span className="shrink-0 text-[10px] text-faint">{item.meta}</span>}
          </label>
        ),
      )}
    </div>
  );
}
