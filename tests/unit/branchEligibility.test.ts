import { describe, expect, it } from 'bun:test';
import { eligibleLocals, namesOlderThan, remoteDeleteTarget } from '@angkorgit/core';

const local = (
  name: string,
  extra: Partial<{
    isHead: boolean;
    isRemote: boolean;
    upstream: string | null;
    ahead: number;
    targetOid: string;
    targetTime: number;
  }> = {},
) => ({
  name,
  isHead: extra.isHead ?? false,
  isRemote: extra.isRemote ?? false,
  upstream: extra.upstream ?? null,
  ahead: extra.ahead ?? 0,
  targetOid: extra.targetOid ?? 'oid',
  targetTime: extra.targetTime ?? 100,
});

describe('eligibleLocals - stale kind', () => {
  it('offers a gone upstream with no unpushed commits', () => {
    const rows = eligibleLocals('stale', {
      locals: [local('old', { upstream: 'origin/old' })],
      remoteBranchNames: ['origin/main'],
      remote: 'origin',
      aheadByName: { old: 0 },
      heldBy: {},
    });
    expect(rows).toEqual([{ name: 'old', oid: 'oid', skip: null }]);
  });

  it('ignores locals without an upstream on that remote', () => {
    const rows = eligibleLocals('stale', {
      locals: [
        local('wip', { upstream: null }),
        local('from-up', { upstream: 'upstream/old' }),
        local('live', { upstream: 'origin/live' }),
      ],
      remoteBranchNames: ['origin/live'],
      remote: 'origin',
      aheadByName: {},
      heldBy: {},
    });
    expect(rows).toEqual([]);
  });

  it('skips head, other worktrees, and unpushed commits', () => {
    const rows = eligibleLocals('stale', {
      locals: [
        local('main', { isHead: true, upstream: 'origin/gone-head' }),
        local('held', { upstream: 'origin/held' }),
        local('wip', { upstream: 'origin/wip', ahead: 2 }),
      ],
      remoteBranchNames: [],
      remote: 'origin',
      aheadByName: { wip: 2 },
      heldBy: { held: '/tmp/wt' },
    });
    expect(rows.map((r) => [r.name, r.skip, r.detail])).toEqual([
      ['held', 'worktree', 'Checked out in /tmp/wt'],
      ['main', 'head', 'Checked out'],
      ['wip', 'unpushed', 'Has unpushed commits'],
    ]);
  });

  it('prefers the pre-fetch ahead snapshot', () => {
    const rows = eligibleLocals('stale', {
      locals: [local('old', { upstream: 'origin/old', ahead: 0 })],
      remoteBranchNames: [],
      remote: 'origin',
      aheadByName: { old: 3 },
      heldBy: {},
    });
    expect(rows[0]?.skip).toBe('unpushed');
  });
});

describe('eligibleLocals - age kind', () => {
  it('lists every local and disables head and other worktrees', () => {
    const rows = eligibleLocals('age', {
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
    const rows = eligibleLocals('age', {
      locals: [local('new', { targetTime: 200 }), local('old', { targetTime: 50 })],
      heldBy: {},
    });
    expect(rows.map((row) => row.name)).toEqual(['old', 'new']);
  });

  it('does not skip unpushed commits for age kind', () => {
    const rows = eligibleLocals('age', {
      locals: [local('wip', { ahead: 5, targetTime: 100 })],
      heldBy: {},
    });
    expect(rows).toEqual([
      {
        name: 'wip',
        oid: 'oid',
        time: 100,
        ahead: 5,
        skip: null,
        detail: undefined,
      },
    ]);
  });

  it('includes time and ahead metadata', () => {
    const rows = eligibleLocals('age', {
      locals: [local('feat', { targetTime: 1_600_000_000, ahead: 3 })],
      heldBy: {},
    });
    expect(rows[0]).toMatchObject({
      name: 'feat',
      time: 1_600_000_000,
      ahead: 3,
    });
  });
});

describe('namesOlderThan', () => {
  it('checks enabled rows older than the cutoff and skips disabled or timeless', () => {
    const now = 1_700_000_000;
    const rows = eligibleLocals('age', {
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
