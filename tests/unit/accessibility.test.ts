import { describe, expect, it } from 'bun:test';

/**
 * Accessibility unit tests
 *
 * These tests catch common accessibility issues that would otherwise
 * only be caught by slower E2E tests. They provide fast feedback during
 * development.
 */

describe('Accessibility - Interactive elements must have proper ARIA roles', () => {
  it('FileRow component structure', () => {
    // Read the actual component file to verify structure
    const fs = require('fs');
    const path = require('path');
    const fileRowPath = path.join(
      __dirname,
      '../../apps/desktop/src/features/commit/WorkingCopyPanel.tsx',
    );
    const content = fs.readFileSync(fileRowPath, 'utf8');

    // Verify FileRow has role="button"
    expect(content).toContain('role="button"');

    // Verify it has tabIndex for keyboard navigation
    expect(content).toContain('tabIndex={0}');

    // Verify it has aria-label
    expect(content).toContain('aria-label');

    // Verify it handles keyboard events
    expect(content).toContain('onKeyDown');
  });

  it('BlamePanel header includes "Blame:" text for visibility', () => {
    const fs = require('fs');
    const path = require('path');
    const blamePanelPath = path.join(
      __dirname,
      '../../apps/desktop/src/features/blame/BlamePanel.tsx',
    );
    const content = fs.readFileSync(blamePanelPath, 'utf8');

    // Verify header contains "Blame:" text
    expect(content).toContain('Blame:');
  });

  it('FileActionsMenu has Blame and File history items', () => {
    const fs = require('fs');
    const path = require('path');
    const menuPath = path.join(
      __dirname,
      '../../apps/desktop/src/features/file-actions/FileActionsMenu.tsx',
    );
    const content = fs.readFileSync(menuPath, 'utf8');

    // Verify Blame menu item exists
    expect(content).toMatch(/<UserRoundSearch.*Blame/s);

    // Verify File history menu item exists
    expect(content).toMatch(/<Clock.*File history/s);
  });

  it('WorkingCopyPanel does not duplicate Blame menu items', () => {
    const fs = require('fs');
    const path = require('path');
    const panelPath = path.join(
      __dirname,
      '../../apps/desktop/src/features/commit/WorkingCopyPanel.tsx',
    );
    const content = fs.readFileSync(panelPath, 'utf8');

    // Count occurrences of standalone Blame menu items
    // (not inside FileActionsMenu component)
    const blameMenuPattern = /<DropdownMenuItem[^>]*onClick.*openBlame/g;
    const matches = content.match(blameMenuPattern);

    // Should not have standalone Blame menu items
    // (all should be through FileActionsMenu)
    expect(matches).toBeFalsy();
  });
});

describe('Accessibility - List items need proper structure', () => {
  it('FileHistoryPanel commit rows should have semantic structure', () => {
    const fs = require('fs');
    const path = require('path');
    const historyPath = path.join(
      __dirname,
      '../../apps/desktop/src/features/history/FileHistoryPanel.tsx',
    );
    const content = fs.readFileSync(historyPath, 'utf8');

    // Verify commit list has proper structure for E2E testing
    // Either role="row" or data-testid for commit items
    const hasRoleRow = content.includes('role="row"');
    const hasTestId =
      content.includes('data-testid="commit-row"') ||
      content.includes('data-testid="file-history-row"');

    if (!hasRoleRow && !hasTestId) {
      throw new Error(
        'FileHistoryPanel commit rows need either role="row" or data-testid for E2E tests. ' +
          'This would cause E2E test "opens file history from blame panel" to fail.',
      );
    }
  });
});
