#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const content = readFileSync('tests/e2e/smoke.test.ts', 'utf-8');
const lines = content.split('\n');

// 提取导入语句
const importLine = lines.find(line => line.includes("from '@rstest/playwright'"));

// 按功能分组测试
const groups = {
  'basic': {
    file: 'tests/e2e/01-basic.test.ts',
    tests: [
      'splash fades',
      'opens the demo repository',
      'selecting a commit',
      'command palette opens',
      'command palette previews',
      'mod+1 and mod+2',
    ]
  },
  'search': {
    file: 'tests/e2e/02-search.test.ts',
    tests: [
      'status bar branch',
      'commit search finds',
      'author box finds',
      'searching a commit hash',
      'short hash prefix',
      'searching a hash that does not exist',
      'mod+f focuses',
    ]
  },
  'conflicts': {
    file: 'tests/e2e/03-conflicts.test.ts',
    tests: [
      'conflict resolver picks',
      'single conflict shows',
      'conflict result can be',
      'conflict picks land',
      'resolver picks with the keyboard',
      'leaving a conflict',
      'conflict resolver shows line numbers',
    ]
  },
  'git-ops': {
    file: 'tests/e2e/04-git-ops.test.ts',
    tests: [
      'right-clicking a branch tip',
      'interactive rebase',
      'cherry-pick opens',
      'multi-select cherry-pick',
      'multi-select offers squash',
      'fetch and clear',
      'deleting a branch on the remote',
      'deleting a tag',
    ]
  },
  'diff-view': {
    file: 'tests/e2e/05-diff.test.ts',
    tests: [
      'clicking a file opens',
      'avatars stay visible',
      'text selection in a diff',
      'opening a diff hides',
      'opening a diff keeps',
      'multi-line comments',
      'diff header opens',
    ]
  },
  'ui-layout': {
    file: 'tests/e2e/06-ui.test.ts',
    tests: [
      'long paths stay',
      'branch names line up',
      'hovering a working copy',
      'commit actions stay',
      'inspector stops at',
      'dragging the sidebar',
      'sidebar sections behave',
    ]
  },
  'worktree-stash': {
    file: 'tests/e2e/07-worktree-stash.test.ts',
    tests: [
      'sidebar lists the demo worktrees',
      'single file can be stashed',
      'working copy filter',
      'commit file list can be filtered',
      'stash lists its files',
      'staged files can be discarded',
      'stash shows up in the graph',
    ]
  },
  'advanced': {
    file: 'tests/e2e/08-advanced.test.ts',
    tests: [
      'commit box separates',
      'commit box grows',
      'folder tree view',
      'graph ref chips',
      'graph display menu can switch',
      'graph display menu hides',
      'collapse all folds',
      'welcome page flags',
      'checked-out branch chip',
      'double-clicking a separated',
      'sidebar comes back',
      'preview layout keeps',
      'arrow keys walk',
      'arrow keys in the working',
      'sidebar batch delete',
    ]
  },
  'integrations': {
    file: 'tests/e2e/09-integrations.test.ts',
    tests: [
      'reconnecting an account',
      'file history row',
      'sidebar lists demo pull',
      'settings can install',
    ]
  },
};

// 创建辅助函数
function extractTest(testName) {
  const startPattern = `test('${testName}`;
  let startIdx = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(startPattern)) {
      startIdx = i;
      break;
    }
  }
  
  if (startIdx === -1) return null;
  
  // 找到测试结束（下一个 test 或文件结束）
  let endIdx = lines.length;
  let braceCount = 0;
  let foundStart = false;
  
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    
    // 计算大括号
    for (const char of line) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
    }
    
    if (line.includes('test(') && i > startIdx) {
      foundStart = true;
    }
    
    if (braceCount === 0 && foundStart && line.includes('});')) {
      endIdx = i + 1;
      break;
    }
  }
  
  return lines.slice(startIdx, endIdx).join('\n');
}

// 生成每个分组的文件
for (const [groupName, config] of Object.entries(groups)) {
  console.log(`Creating ${config.file}...`);
  
  const testContents = [];
  for (const testPattern of config.tests) {
    const testCode = extractTest(testPattern);
    if (testCode) {
      testContents.push(testCode);
    } else {
      console.warn(`Warning: Could not find test matching "${testPattern}"`);
    }
  }
  
  const fileContent = `${importLine}\n\n${testContents.join('\n\n')}\n`;
  writeFileSync(config.file, fileContent);
  console.log(`✓ Created ${config.file} with ${testContents.length} tests`);
}

console.log('\n✅ All test files created!');
