# Keyboard Focus Management — Verification Guide

## Summary

Implemented full keyboard operability for all list-style panels in AngKorGit. Users can now navigate entirely via keyboard using Tab/Shift+Tab, Arrow keys, and Enter.

## Changed Panels

### 1. **Switch Branch** (Status bar branch name dropdown)
- **Open**: Click branch name in status bar OR press `⌘B` (Ctrl+B)
- **Test**:
  1. Focus starts on filter input
  2. Press **Tab** → focus moves to first branch
  3. Press **Tab** again → focus moves to second branch
  4. Press **Shift+Tab** → focus moves back to previous branch
  5. Press **Shift+Tab** at first item → focus returns to filter input
  6. **Arrow Up/Down** also navigate items
  7. **Enter** on any item checks out that branch
  8. **Escape** on empty filter closes; on non-empty filter clears it first

### 2. **Command Palette** (`⌘K` / `Ctrl+K`)
- **Test**:
  1. Focus starts on search input
  2. Press **Tab** → focus moves to first command item
  3. **Tab/Shift+Tab** navigate through visible commands
  4. **Arrow Up/Down** also work (cmdk default)
  5. **Enter** executes the focused command
  6. **Escape** closes palette

### 3. **Go to Panel** (`⌘⇧?` / `Ctrl+Shift+?`)
- Same Tab behavior as Command Palette
- **Test**:
  1. Press `⌘⇧?` to open
  2. **Tab** moves from search to first panel
  3. Navigate with **Tab/Shift+Tab** or **Arrow keys**
  4. **Enter** opens the focused panel/dialog

### 4. **Recent Repositories** (`⌘O` / `Ctrl+O`)
- Same Tab behavior as Command Palette
- **Test**:
  1. Press `⌘O` to open
  2. Type to filter repositories
  3. **Tab** moves from filter to first repo
  4. Navigate with **Tab/Shift+Tab** or **Arrow keys**
  5. **Enter** opens the focused repository
  6. Footer actions (Browse, Clone) are also in Tab order

### 5. **Welcome Page** (Recent repos list)
- Already had arrow key navigation, now adds Tab support
- **Test**:
  1. On welcome screen, search box is auto-focused
  2. Type to filter repos
  3. Press **Tab** → focus moves to first repo row
  4. **Tab/Shift+Tab** navigate through repos
  5. **Arrow Up/Down** also work
  6. **Enter** opens the focused repository
  7. Updated placeholder: "Search, ↑↓⇥ to choose, ⏎ to open"

## Keyboard Model

All panels now follow this consistent model:

| Key | Action |
|-----|--------|
| **Tab** | Move forward: Input → Item 1 → Item 2 → ... |
| **Shift+Tab** | Move backward: ... → Item 2 → Item 1 → Input |
| **Arrow Up/Down** | Navigate items (updates highlight/active state) |
| **Enter** | Activate focused/highlighted item |
| **Escape** | Clear filter (when non-empty) OR close panel (when empty) |

## Implementation Details

### For DropdownMenu-based panels (Switch Branch)
- Created `useListFocus` hook in `src/shared/useListFocus.ts`
- Manages roving `tabIndex` on items
- Handles Tab/Shift+Tab, Arrow keys, Enter, Escape
- Auto-scrolls active item into view

### For cmdk-based panels (Command Palette, Panels, Recent Repos)
- Added Tab handler in each panel's `useEffect`
- Detects when input has focus and Tab is pressed
- Finds first `[cmdk-item]` and focuses it
- cmdk's built-in arrow key navigation preserved
- Items are already focusable by cmdk

## Testing Checklist

- [ ] Switch Branch: Tab navigates from filter to items
- [ ] Switch Branch: Shift+Tab reverses direction
- [ ] Switch Branch: Arrow keys still work
- [ ] Switch Branch: Enter checks out branch
- [ ] Command Palette: Tab moves to first action
- [ ] Command Palette: Can execute actions via Tab+Enter
- [ ] Go to Panel: Tab navigates panel list
- [ ] Recent Repos: Tab navigates repo list
- [ ] Recent Repos: Footer actions (Browse, Clone) accessible via Tab
- [ ] Welcome Page: Tab navigates recent repos
- [ ] All panels: Escape closes/clears appropriately
- [ ] All panels: No Tab traps (can always escape)

## Files Changed

1. `apps/desktop/src/shared/useListFocus.ts` — NEW hook for list focus management
2. `apps/desktop/src/components/StatusBar.tsx` — Switch Branch uses `useListFocus`
3. `apps/desktop/src/features/repository/WelcomePage.tsx` — Recent repos use `useListFocus`
4. `apps/desktop/src/components/CommandPalette.tsx` — Added Tab handler
5. `apps/desktop/src/components/PanelsDialog.tsx` — Added Tab handler
6. `apps/desktop/src/components/RecentReposDialog.tsx` — Added Tab handler

## Notes

- The implementation preserves all existing keyboard shortcuts (arrows, Ctrl+N/P, Cmd+1-9)
- Tab navigation works alongside cmdk's built-in arrow key navigation
- Focus indicators use existing design system styles
- Accessible: proper `aria-selected`, `tabIndex`, `role="button"` attributes
- No breaking changes to existing behavior
