#!/usr/bin/env python3

import re

# 读取完整测试文件
with open('/tmp/full-tests.ts', 'r') as f:
    content = f.read()

# 提取导入行
import_line = "import { expect, test } from '@rstest/playwright';\n"

# 定义测试组
groups = {
    '02-search-nav': {
        'file': 'tests/e2e/02-search-nav.test.ts',
        'patterns': [
            'the status bar branch name opens a local branch switcher',
            'commit search finds matches in the full graph',
            'the author box finds commits without flattening the graph',
            'searching a commit hash jumps to it in the full graph',
            'a short hash prefix jumps like a full hash',
            'searching a hash that does not exist keeps the graph',
            'mod+f focuses the commit search box',
        ]
    },
    '04-git-ops': {
        'file': 'tests/e2e/04-git-ops.test.ts',
        'patterns': [
            'right-clicking a branch tip offers to push',
            'interactive rebase dialog opens',
            'cherry-pick opens a dialog with the source reference',
            'multi-select cherry-pick lists every commit',
            'multi-select offers squash and pre-fills',
            'fetch and clear local branches asks with checkboxes',
            'deleting a branch on the remote too asks first',
            'deleting a tag that is not on the remote',
        ]
    },
    '05-diff-ui': {
        'file': 'tests/e2e/05-diff-ui.test.ts',
        'patterns': [
            'clicking a file opens the diff already at its first change',
            'long paths stay inside confirmation dialogs',
            'branch names line up whether or not',
            'hovering a working copy file reveals its full path',
            'avatars stay visible after opening and closing a diff',
            'text selection in a diff survives',
            'commit actions stay inside a narrow working copy',
            'opening a diff hides the sidebar and toggling it back',
            'opening a diff keeps the inspector at the same width',
            'the inspector stops at its minimum width',
            'dragging the sidebar shut and back open',
        ]
    },
    '06-advanced-ui': {
        'file': 'tests/e2e/06-advanced-ui.test.ts',
        'patterns': [
            'sidebar lists the demo worktrees',
            'multi-line comments in a diff stay highlighted',
            'collapse all folds every sidebar section',
            'commit box separates a summary line',
            'the commit box grows when its top edge is dragged',
            'folder tree view can collapse and expand',
            'graph ref chips show whole labels',
            'graph display menu can switch the lane color band',
            'graph display menu hides and restores the hash column',
            'sidebar sections behave as an accordion',
        ]
    },
    '07-stash-worktree': {
        'file': 'tests/e2e/07-stash-worktree.test.ts',
        'patterns': [
            'a single file can be stashed from its row menu',
            'shift-click selects a range of working copy files',
            'the working copy filter narrows both lists',
            'the commit file list can be filtered by path',
            'a stash lists its files and one file can be restored',
            'staged files can be discarded from the row',
            'a stash shows up in the graph with its own node',
        ]
    },
    '08-misc': {
        'file': 'tests/e2e/08-misc.test.ts',
        'patterns': [
            'reconnecting an account opens the token form',
            'a file history row can open the full commit',
            'sidebar lists demo pull requests',
            'welcome page flags missing folders',
            'conflict resolver shows line numbers',
            'the checked-out branch chip is filled',
            'double-clicking a separated origin chip',
            'the diff header opens the history',
            'the sidebar comes back after a relaunch',
            'preview layout keeps the commit list visible',
            'arrow keys walk from the graph',
            'arrow keys in the working copy',
            'sidebar batch delete lists locals',
            'settings can install the command line tool',
        ]
    },
}

def extract_test(content, pattern):
    """提取单个测试"""
    # 找到测试开始
    test_start = content.find(f"test('{pattern}")
    if test_start == -1:
        # 尝试部分匹配
        for line in content.split('\n'):
            if 'test(' in line and pattern[:20] in line:
                test_start = content.find(line)
                break
    
    if test_start == -1:
        return None
    
    # 从测试开始向后查找，计数括号
    brace_count = 0
    in_test = False
    end_pos = test_start
    
    for i in range(test_start, len(content)):
        char = content[i]
        if char == '{':
            brace_count += 1
            in_test = True
        elif char == '}':
            brace_count -= 1
            if in_test and brace_count == 0:
                # 找到匹配的结束括号，继续到 );
                for j in range(i, min(i+10, len(content))):
                    if content[j:j+2] == ');':
                        end_pos = j + 2
                        break
                break
    
    if end_pos > test_start:
        return content[test_start:end_pos]
    return None

# 处理每个组
for group_name, config in groups.items():
    print(f"\nCreating {config['file']}...")
    tests = []
    
    for pattern in config['patterns']:
        test_code = extract_test(content, pattern)
        if test_code:
            tests.append(test_code)
            print(f"  ✓ Found: {pattern[:50]}...")
        else:
            print(f"  ✗ Missing: {pattern[:50]}...")
    
    if tests:
        file_content = import_line + '\n' + '\n\n'.join(tests) + '\n'
        with open(config['file'], 'w') as f:
            f.write(file_content)
        print(f"✓ Created {config['file']} with {len(tests)} tests")
    else:
        print(f"✗ No tests found for {group_name}")

print("\n✅ All test files created!")
