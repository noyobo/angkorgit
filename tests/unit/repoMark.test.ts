import { describe, expect, it } from 'vitest';
import { repoMark } from '@angkorgit/core';

describe('repo mark', () => {
  it('takes the first letter of the first two hyphen or underscore segments', () => {
    expect(repoMark('mothra-framework').letters).toBe('MF');
    expect(repoMark('temple_ui').letters).toBe('TU');
    expect(repoMark('foo-bar-baz').letters).toBe('FB');
  });

  it('takes the first two characters of a single segment', () => {
    expect(repoMark('angkorgit').letters).toBe('AN');
    expect(repoMark('a').letters).toBe('A');
  });

  it('returns ? when the name is empty', () => {
    expect(repoMark('').letters).toBe('?');
    expect(repoMark('   ').letters).toBe('?');
    expect(repoMark('--').letters).toBe('?');
  });

  it('hashes the name onto graph lane 0–9 and stays stable', () => {
    const a = repoMark('angkorgit');
    const b = repoMark('angkorgit');
    const c = repoMark('temple-ui');
    expect(a.color).toBe(b.color);
    expect(a.color).toBeGreaterThanOrEqual(0);
    expect(a.color).toBeLessThan(10);
    expect(c.color).not.toBe(a.color);
  });

  it('spreads names that used to collapse onto one lane', () => {
    const colors = new Set(
      ['mothra-framework-v1', 'mothra-framework', 'angkorgit'].map((n) => repoMark(n).color),
    );
    expect(colors.size).toBe(3);
  });
});
