import { describe, expect, it } from 'vitest';
import { classifyDeletableLocals, namesOlderThan, remoteDeleteTarget } from '@angkorgit/core';

const local = (
  name: string,
  extra: Partial<{
    isHead: boolean;
    isRemote: boolean;
    targetOid: string;
    targetTime: number;
    ahead: number;
  }> = {},
) => ({
  name,
  isHead: extra.isHead ?? false,
  isRemote: extra.isRemote ?? false,
  targetOid: extra.targetOid ?? 'oid',
  targetTime: extra.targetTime ?? 100,
  ahead: extra.ahead ?? 0,
});

describe('classifyDeletableLocals', () => {
  it('lists every local and disables head and other worktrees', () => {
    const rows = classifyDeletableLocals({
      locals: [
        local('main', { isHead: true, targetTime: 300 }),
        local('held', { targetTime: 200 }),
        local('wip', { ahead: 2, targetTime: 100 }),
        local('origin/main', { isRemote: true, targetTime: 50 }),
      ],
      heldBy: { held: 'other' },
    });
    expect(rows.map((row) => [row.name, row.skip, row.detail])).toEqual([
      ['wip', null, undefined],
      ['held', 'worktree', 'Checked out in other'],
      ['main', 'head', 'Checked out'],
    ]);
  });

  it('sorts oldest tip first', () => {
    const rows = classifyDeletableLocals({
      locals: [local('new', { targetTime: 200 }), local('old', { targetTime: 50 })],
      heldBy: {},
    });
    expect(rows.map((row) => row.name)).toEqual(['old', 'new']);
  });
});

describe('namesOlderThan', () => {
  it('checks enabled rows older than the cutoff and skips disabled or timeless', () => {
    const now = 1_700_000_000;
    const rows = classifyDeletableLocals({
      locals: [
        local('main', { isHead: true, targetTime: 1_000_000_000 }),
        local('ancient', { targetTime: 1_600_000_000 }),
        local('recent', { targetTime: 1_699_000_000 }),
        local('unknown', { targetTime: 0 }),
      ],
      heldBy: {},
    });
    expect(namesOlderThan(rows, now, 90)).toEqual(['ancient']);
  });
});

describe('remoteDeleteTarget', () => {
  it('prefers the upstream remote and falls back to the first remote', () => {
    expect(remoteDeleteTarget('feat', 'origin/feat', 'upstream')).toEqual({
      remote: 'origin',
      remoteName: 'feat',
    });
    expect(remoteDeleteTarget('local-only', null, 'origin')).toEqual({
      remote: 'origin',
      remoteName: 'local-only',
    });
    expect(remoteDeleteTarget('local-only', null, undefined)).toBeNull();
  });
});
