import React, { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import {
  Palette,
  FolderOpen,
  Settings,
  GitBranchPlus,
  Pencil,
  Archive,
  Tag as TagIcon,
  FolderTree,
  ListOrdered,
  ListRestart,
  Trash2,
  GitPullRequest,
  Layers,
} from 'lucide-react';
import { PaletteShell, PaletteItem } from './PaletteShell';
import { useUi } from '@/features/ui/store';
import { modKey } from '@/shared/utils';

interface PanelEntry {
  id: string;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  action: () => void;
}

export function PanelsDialog() {
  const panelsOpen = useUi((s) => s.panelsOpen);
  const setPanelsOpen = useUi((s) => s.setPanelsOpen);
  const openDialog = useUi((s) => s.openDialog);
  const setPaletteOpen = useUi((s) => s.setPaletteOpen);
  const setRecentReposOpen = useUi((s) => s.setRecentReposOpen);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (panelsOpen) {
      setSearch('');
    }
  }, [panelsOpen]);

  const panels: PanelEntry[] = [
    {
      id: 'command-palette',
      icon: <Palette />,
      label: 'Command Palette',
      shortcut: 'K',
      action: () => {
        setPanelsOpen(false);
        setPaletteOpen(true);
      },
    },
    {
      id: 'recent-repos',
      icon: <FolderOpen />,
      label: 'Open Repository / Recent repositories',
      shortcut: 'O',
      action: () => {
        setPanelsOpen(false);
        setRecentReposOpen(true);
      },
    },
    {
      id: 'settings',
      icon: <Settings />,
      label: 'Settings',
      shortcut: ',',
      action: () => {
        setPanelsOpen(false);
        openDialog('settings');
      },
    },
    {
      id: 'create-branch',
      icon: <GitBranchPlus />,
      label: 'Create branch…',
      action: () => {
        setPanelsOpen(false);
        openDialog('createBranch');
      },
    },
    {
      id: 'rename-branch',
      icon: <Pencil />,
      label: 'Rename branch…',
      action: () => {
        setPanelsOpen(false);
        openDialog('rename');
      },
    },
    {
      id: 'delete-branches',
      icon: <Trash2 />,
      label: 'Delete branches…',
      action: () => {
        setPanelsOpen(false);
        void import('@/features/repository/deleteBranches').then(({ openDeleteBranches }) => {
          void openDeleteBranches(() => Promise.resolve());
        });
      },
    },
    {
      id: 'create-tag',
      icon: <TagIcon />,
      label: 'Create tag…',
      action: () => {
        setPanelsOpen(false);
        openDialog('createTag');
      },
    },
    {
      id: 'create-stash',
      icon: <Archive />,
      label: 'Stash changes…',
      action: () => {
        setPanelsOpen(false);
        openDialog('createStash');
      },
    },
    {
      id: 'create-worktree',
      icon: <FolderTree />,
      label: 'New worktree…',
      action: () => {
        setPanelsOpen(false);
        openDialog('createWorktree');
      },
    },
    {
      id: 'interactive-rebase',
      icon: <ListOrdered />,
      label: 'Interactive rebase…',
      action: () => {
        setPanelsOpen(false);
        openDialog('interactiveRebase');
      },
    },
    {
      id: 'cherry-pick',
      icon: <ListRestart />,
      label: 'Cherry-pick…',
      action: () => {
        setPanelsOpen(false);
        openDialog('cherryPick');
      },
    },
    {
      id: 'create-pr',
      icon: <GitPullRequest />,
      label: 'Create pull request…',
      action: () => {
        setPanelsOpen(false);
        openDialog('createPullRequest');
      },
    },
    {
      id: 'clone',
      icon: <GitBranchPlus />,
      label: 'Clone repository…',
      action: () => {
        setPanelsOpen(false);
        openDialog('clone');
      },
    },
  ];

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'n' && e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      e.currentTarget.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })
      );
    }
    if (e.key === 'p' && e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      e.currentTarget.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true })
      );
    }
  };

  useEffect(() => {
    if (!panelsOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        e.stopPropagation();
        const index = parseInt(e.key) - 1;
        const items = Array.from(document.querySelectorAll('[cmdk-item]:not([data-disabled="true"])'));
        const item = items[index];
        if (item instanceof HTMLElement) item.click();
      }
      
      // Tab navigation: input to first item, or between items
      if (e.key === 'Tab') {
        const items = Array.from(document.querySelectorAll('[cmdk-item]:not([data-disabled="true"])'));
        if (items.length === 0) return;
        
        if (e.target instanceof HTMLInputElement) {
          // From input to first item
          if (!e.shiftKey && items[0] instanceof HTMLElement) {
            e.preventDefault();
            items[0].focus();
          }
        } else if (e.target instanceof HTMLElement && e.target.hasAttribute('cmdk-item')) {
          // Between items
          e.preventDefault();
          const currentIndex = items.indexOf(e.target);
          if (currentIndex === -1) return;
          
          if (e.shiftKey) {
            // Shift+Tab: move backward
            if (currentIndex > 0) {
              const prev = items[currentIndex - 1];
              if (prev instanceof HTMLElement) prev.focus();
            } else {
              // Back to input
              const input = document.querySelector('[cmdk-input]') as HTMLInputElement | null;
              input?.focus();
            }
          } else {
            // Tab: move forward
            if (currentIndex < items.length - 1) {
              const next = items[currentIndex + 1];
              if (next instanceof HTMLElement) next.focus();
            }
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [panelsOpen]);

  return (
    <PaletteShell
      open={panelsOpen}
      onOpenChange={setPanelsOpen}
      label="Go to Panel"
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Find a panel or dialog…"
      headerIcon={<Layers />}
      dataAttribute="data-panels-open"
      onSearchKeyDown={handleSearchKeyDown}
    >
      <Command.Empty className="py-8 text-center text-sm text-faint">No panels match.</Command.Empty>
      <Command.Group heading="Panels &amp; Dialogs">
        <QuickKeyItems>
          {panels.map((panel) => (
            <PaletteItem
              key={panel.id}
              icon={panel.icon}
              label={panel.label}
              hint={panel.shortcut ? `${modKey()}${panel.shortcut}` : undefined}
              onSelect={panel.action}
            />
          ))}
        </QuickKeyItems>
      </Command.Group>
    </PaletteShell>
  );
}

function QuickKeyItems({ children }: { children: React.ReactNode }) {
  const [quickKeys, setQuickKeys] = React.useState<Map<number, number>>(new Map());

  React.useEffect(() => {
    const updateQuickKeys = () => {
      const items = Array.from(document.querySelectorAll('[cmdk-item]:not([data-disabled="true"])'));
      const newQuickKeys = new Map<number, number>();
      items.forEach((item, index) => {
        if (index < 9 && item instanceof HTMLElement) {
          const itemIndex = parseInt(item.getAttribute('data-item-index') ?? '-1');
          if (itemIndex >= 0) {
            newQuickKeys.set(itemIndex, index + 1);
          }
        }
      });
      setQuickKeys(newQuickKeys);
    };

    const timer = setTimeout(updateQuickKeys, 0);
    return () => clearTimeout(timer);
  });

  let itemIndex = 0;
  return (
    <>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        const currentIndex = itemIndex++;
        const quickKey = quickKeys.get(currentIndex);
        return React.cloneElement(child as React.ReactElement<{ quickKey?: number; 'data-item-index'?: number }>, {
          quickKey,
          'data-item-index': currentIndex,
        });
      })}
    </>
  );
}
