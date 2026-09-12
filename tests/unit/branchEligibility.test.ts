import { describe, it, expect } from 'vitest';
import { eligibleLocals, namesOlderThan, remoteDeleteTarget } from '@angkorgit/core';
import type { BranchInput } from '@angkorgit/core';

describe('eligibleLocals', () => {
  describe('kind: stale', () => {
    it('identifies branches with gone upstream', () => {
      const locals: BranchInput[] = [
        {
          name: 'main',
          isHead: false,
          isRemote: false,
          upstream: 'origin/main',
          ahead: 0,
          targetOid: 'abc123',
          targetTime: 1000,
        },
        {
          name: 'feature',
          isHead: false,
          isRemote: false,
          upstream: 'origin/feature',
          ahead: 0,
          targetOid: 'def456',
          targetTime: 2000,
        },
        {
          name: 'other',
          isHead: false,
          isRemote: false,
          upstream: 'origin/other',
          ahead: 0,
          targetOid: 'ghi789',
          targetTime: 3000,
        },
      ];

      const result = eligibleLocals({
        kind: 'stale',
        locals,
        remoteBranchNames: ['origin/main', 'origin/other'],
        remote: 'origin',
        heldBy: {},
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('feature');
      expect(result[0].skip).toBeNull();
    });

    it('skips HEAD branch', () => {
      const locals: BranchInput[] = [
        {
          name: 'feature',
          isHead: true,
          isRemote: false,
          upstream: 'origin/feature',
          ahead: 0,
          targetOid: 'abc123',
          targetTime: 1000,
        },
      ];

      const result = eligibleLocals({
        kind: 'stale',
        locals,
        remoteBranchNames: [],
        remote: 'origin',
        heldBy: {},
      });

      expect(result).toHaveLength(1);
      expect(result[0].skip).toBe('head');
      expect(result[0].detail).toBe('Checked out');
    });

    it('skips worktree-held branches', () => {
      const locals: BranchInput[] = [
        {
          name: 'feature',
          isHead: false,
          isRemote: false,
          upstream: 'origin/feature',
          ahead: 0,
          targetOid: 'abc123',
          targetTime: 1000,
        },
      ];

      const result = eligibleLocals({
        kind: 'stale',
        locals,
        remoteBranchNames: [],
        remote: 'origin',
        heldBy: { feature: 'feature-worktree' },
      });

      expect(result).toHaveLength(1);
      expect(result[0].skip).toBe('worktree');
      expect(result[0].detail).toBe('Checked out in feature-worktree');
    });

    it('skips branches with unpushed commits', () => {
      const locals: BranchInput[] = [
        {
          name: 'feature',
          isHead: false,
          isRemote: false,
          upstream: 'origin/feature',
          ahead: 3,
          targetOid: 'abc123',
          targetTime: 1000,
        },
      ];

      const result = eligibleLocals({
        kind: 'stale',
        locals,
        remoteBranchNames: [],
        remote: 'origin',
        heldBy: {},
      });

      expect(result).toHaveLength(1);
      expect(result[0].skip).toBe('unpushed');
      expect(result[0].detail).toBe('Has unpushed commits');
    });

    it('uses aheadByName when provided', () => {
      const locals: BranchInput[] = [
        {
          name: 'feature',
          isHead: false,
          isRemote: false,
          upstream: 'origin/feature',
          ahead: 0,
          targetOid: 'abc123',
          targetTime: 1000,
        },
      ];

      const result = eligibleLocals({
        kind: 'stale',
        locals,
        remoteBranchNames: [],
        remote: 'origin',
        heldBy: {},
        aheadByName: { feature: 5 },
      });

      expect(result).toHaveLength(1);
      expect(result[0].skip).toBe('unpushed');
      expect(result[0].ahead).toBe(5);
    });

    it('sorts skipped items last', () => {
      const locals: BranchInput[] = [
        {
          name: 'a-deletable',
          isHead: false,
          isRemote: false,
          upstream: 'origin/a-deletable',
          ahead: 0,
          targetOid: 'aaa',
          targetTime: 1000,
        },
        {
          name: 'b-held',
          isHead: false,
          isRemote: false,
          upstream: 'origin/b-held',
          ahead: 0,
          targetOid: 'bbb',
          targetTime: 2000,
        },
        {
          name: 'c-deletable',
          isHead: false,
          isRemote: false,
          upstream: 'origin/c-deletable',
          ahead: 0,
          targetOid: 'ccc',
          targetTime: 3000,
        },
      ];

      const result = eligibleLocals({
        kind: 'stale',
        locals,
        remoteBranchNames: [],
        remote: 'origin',
        heldBy: { 'b-held': 'worktree' },
      });

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('a-deletable');
      expect(result[0].skip).toBeNull();
      expect(result[1].name).toBe('c-deletable');
      expect(result[1].skip).toBeNull();
      expect(result[2].name).toBe('b-held');
      expect(result[2].skip).toBe('worktree');
    });

    it('ignores branches without matching remote prefix', () => {
      const locals: BranchInput[] = [
        {
          name: 'feature',
          isHead: false,
          isRemote: false,
          upstream: 'upstream/feature',
          ahead: 0,
          targetOid: 'abc123',
          targetTime: 1000,
        },
      ];

      const result = eligibleLocals({
        kind: 'stale',
        locals,
        remoteBranchNames: [],
        remote: 'origin',
        heldBy: {},
      });

      expect(result).toHaveLength(0);
    });

    it('ignores branches without upstream', () => {
      const locals: BranchInput[] = [
        {
          name: 'local-only',
          isHead: false,
          isRemote: false,
          upstream: null,
          ahead: 0,
          targetOid: 'abc123',
          targetTime: 1000,
        },
      ];

      const result = eligibleLocals({
        kind: 'stale',
        locals,
        remoteBranchNames: [],
        remote: 'origin',
        heldBy: {},
      });

      expect(result).toHaveLength(0);
    });

    it('ignores remote branches', () => {
      const locals: BranchInput[] = [
        {
          name: 'origin/feature',
          isHead: false,
          isRemote: true,
          upstream: null,
          ahead: 0,
          targetOid: 'abc123',
          targetTime: 1000,
        },
      ];

      const result = eligibleLocals({
        kind: 'stale',
        locals,
        remoteBranchNames: [],
        remote: 'origin',
        heldBy: {},
      });

      expect(result).toHaveLength(0);
    });

    it('throws when required parameters are missing', () => {
      expect(() =>
        eligibleLocals({
          kind: 'stale',
          locals: [],
          heldBy: {},
        } as any),
      ).toThrow("kind 'stale' requires remoteBranchNames and remote");
    });
  });

  describe('kind: age', () => {
    it('lists all local branches', () => {
      const locals: BranchInput[] = [
        {
          name: 'old',
          isHead: false,
          isRemote: false,
          upstream: null,
          ahead: 0,
          targetOid: 'abc',
          targetTime: 1000,
        },
        {
          name: 'new',
          isHead: false,
          isRemote: false,
          upstream: null,
          ahead: 0,
          targetOid: 'def',
          targetTime: 5000,
        },
        {
          name: 'middle',
          isHead: false,
          isRemote: false,
          upstream: null,
          ahead: 0,
          targetOid: 'ghi',
          targetTime: 3000,
        },
      ];

      const result = eligibleLocals({
        kind: 'age',
        locals,
        heldBy: {},
      });

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('old');
      expect(result[1].name).toBe('middle');
      expect(result[2].name).toBe('new');
    });

    it('marks HEAD as skipped', () => {
      const locals: BranchInput[] = [
        {
          name: 'main',
          isHead: true,
          isRemote: false,
          upstream: null,
          ahead: 0,
          targetOid: 'abc',
          targetTime: 1000,
        },
      ];

      const result = eligibleLocals({
        kind: 'age',
        locals,
        heldBy: {},
      });

      expect(result).toHaveLength(1);
      expect(result[0].skip).toBe('head');
      expect(result[0].detail).toBe('Checked out');
    });

    it('marks worktree-held branches as skipped', () => {
      const locals: BranchInput[] = [
        {
          name: 'feature',
          isHead: false,
          isRemote: false,
          upstream: null,
          ahead: 0,
          targetOid: 'abc',
          targetTime: 1000,
        },
      ];

      const result = eligibleLocals({
        kind: 'age',
        locals,
        heldBy: { feature: 'my-worktree' },
      });

      expect(result).toHaveLength(1);
      expect(result[0].skip).toBe('worktree');
      expect(result[0].detail).toBe('Checked out in my-worktree');
    });

    it('sorts by time (oldest first)', () => {
      const locals: BranchInput[] = [
        {
          name: 'new',
          isHead: false,
          isRemote: false,
          upstream: null,
          ahead: 0,
          targetOid: 'abc',
          targetTime: 5000,
        },
        {
          name: 'old',
          isHead: false,
          isRemote: false,
          upstream: null,
          ahead: 0,
          targetOid: 'def',
          targetTime: 1000,
        },
        {
          name: 'middle',
          isHead: false,
          isRemote: false,
          upstream: null,
          ahead: 0,
          targetOid: 'ghi',
          targetTime: 3000,
        },
      ];

      const result = eligibleLocals({
        kind: 'age',
        locals,
        heldBy: {},
      });

      expect(result.map((r) => r.name)).toEqual(['old', 'middle', 'new']);
    });

    it('ignores remote branches', () => {
      const locals: BranchInput[] = [
        {
          name: 'origin/main',
          isHead: false,
          isRemote: true,
          upstream: null,
          ahead: 0,
          targetOid: 'abc',
          targetTime: 1000,
        },
        {
          name: 'main',
          isHead: false,
          isRemote: false,
          upstream: null,
          ahead: 0,
          targetOid: 'def',
          targetTime: 2000,
        },
      ];

      const result = eligibleLocals({
        kind: 'age',
        locals,
        heldBy: {},
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('main');
    });

    it('preserves ahead count', () => {
      const locals: BranchInput[] = [
        {
          name: 'feature',
          isHead: false,
          isRemote: false,
          upstream: 'origin/feature',
          ahead: 5,
          targetOid: 'abc',
          targetTime: 1000,
        },
      ];

      const result = eligibleLocals({
        kind: 'age',
        locals,
        heldBy: {},
      });

      expect(result[0].ahead).toBe(5);
    });
  });
});

describe('namesOlderThan', () => {
  it('filters branches older than threshold', () => {
    const now = 1_700_000_000; // Realistic Unix timestamp (2023)
    const days1 = 1 * 86400;
    const rows = [
      { name: 'very-old', oid: 'a', time: now - days1 * 10, ahead: 0, skip: null },
      { name: 'old', oid: 'b', time: now - days1 * 2, ahead: 0, skip: null },
      { name: 'recent', oid: 'c', time: now - 1000, ahead: 0, skip: null },
    ];

    const result = namesOlderThan(rows, now, 1);

    expect(result).toHaveLength(2);
    expect(result).toContain('very-old');
    expect(result).toContain('old');
    expect(result).not.toContain('recent');
  });

  it('excludes skipped branches', () => {
    const now = 1_700_000_000;
    const days90 = 90 * 86400;
    const rows = [
      { name: 'old-head', oid: 'a', time: now - days90 - 1000, ahead: 0, skip: 'head' as const },
      { name: 'old-worktree', oid: 'b', time: now - days90 - 1000, ahead: 0, skip: 'worktree' as const },
      { name: 'old-unpushed', oid: 'c', time: now - days90 - 1000, ahead: 0, skip: 'unpushed' as const },
      { name: 'old-deletable', oid: 'd', time: now - days90 - 1000, ahead: 0, skip: null },
    ];

    const result = namesOlderThan(rows, now, 90);

    expect(result).toHaveLength(1);
    expect(result).toEqual(['old-deletable']);
  });

  it('handles zero-time branches', () => {
    const now = 1_700_000_000;
    const days90 = 90 * 86400;
    const rows = [
      { name: 'zero-time', oid: 'a', time: 0, ahead: 0, skip: null },
      { name: 'old', oid: 'b', time: now - days90 - 1000, ahead: 0, skip: null },
    ];

    const result = namesOlderThan(rows, now, 90);

    expect(result).toEqual(['old']);
  });

  it('calculates cutoff correctly', () => {
    const now = 1_700_000_000;
    const days90 = 90 * 86400;
    const rows = [
      { name: 'exactly-90', oid: 'a', time: now - days90, ahead: 0, skip: null },
      { name: 'older-than-90', oid: 'b', time: now - days90 - 1, ahead: 0, skip: null },
      { name: 'newer-than-90', oid: 'c', time: now - days90 + 1, ahead: 0, skip: null },
    ];

    const result = namesOlderThan(rows, now, 90);

    expect(result).toEqual(['older-than-90']);
  });

  it('returns empty array when no branches qualify', () => {
    const now = 1_700_000_000;
    const rows = [
      { name: 'recent', oid: 'a', time: now - 1000, ahead: 0, skip: null },
      { name: 'skipped', oid: 'b', time: now - 90 * 86400 - 1000, ahead: 0, skip: 'head' as const },
    ];

    const result = namesOlderThan(rows, now, 90);

    expect(result).toEqual([]);
  });
});

describe('remoteDeleteTarget', () => {
  it('parses remote from upstream', () => {
    const result = remoteDeleteTarget('feature', 'origin/feature', 'backup');
    expect(result).toEqual({ remote: 'origin', remoteName: 'feature' });
  });

  it('handles upstream with nested path', () => {
    const result = remoteDeleteTarget('my-branch', 'origin/nested/path', 'backup');
    expect(result).toEqual({ remote: 'origin', remoteName: 'nested/path' });
  });

  it('falls back to firstRemote when no upstream', () => {
    const result = remoteDeleteTarget('feature', null, 'backup');
    expect(result).toEqual({ remote: 'backup', remoteName: 'feature' });
  });

  it('uses branch name with firstRemote fallback', () => {
    const result = remoteDeleteTarget('my-feature', null, 'origin');
    expect(result).toEqual({ remote: 'origin', remoteName: 'my-feature' });
  });

  it('returns null when no upstream and no firstRemote', () => {
    const result = remoteDeleteTarget('feature', null, undefined);
    expect(result).toBeNull();
  });

  it('returns null for upstream without slash', () => {
    const result = remoteDeleteTarget('feature', 'noslash', undefined);
    expect(result).toBeNull();
  });

  it('prefers upstream over firstRemote', () => {
    const result = remoteDeleteTarget('feature', 'upstream/feature', 'origin');
    expect(result).toEqual({ remote: 'upstream', remoteName: 'feature' });
  });
});
