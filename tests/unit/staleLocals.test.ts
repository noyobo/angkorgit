import { describe, expect, it } from 'vitest';
import { classifyStaleLocals } from '@angkorgit/core';

const local = (
  name: string,
  extra: Partial<{ isHead: boolean; upstream: string | null; ahead: number; targetOid: string }> = {},
) => ({
  name,
  isHead: extra.isHead ?? false,
  isRemote: false,
  upstream: extra.upstream ?? null,
  ahead: extra.ahead ?? 0,
  targetOid: extra.targetOid ?? 'oid',
});

describe('classifyStaleLocals', () => {
  it('offers a gone upstream with no unpushed commits', () => {
    const rows = classifyStaleLocals({
      locals: [local('old', { upstream: 'origin/old' })],
      remoteBranchNames: ['origin/main'],
      remote: 'origin',
      aheadByName: { old: 0 },
      heldBy: {},
    });
    expect(rows).toEqual([{ name: 'old', oid: 'oid', skip: null }]);
  });

  it('ignores locals without an upstream on that remote', () => {
    const rows = classifyStaleLocals({
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
    const rows = classifyStaleLocals({
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
    const rows = classifyStaleLocals({
      locals: [local('old', { upstream: 'origin/old', ahead: 0 })],
      remoteBranchNames: [],
      remote: 'origin',
      aheadByName: { old: 3 },
      heldBy: {},
    });
    expect(rows[0]?.skip).toBe('unpushed');
  });
});
