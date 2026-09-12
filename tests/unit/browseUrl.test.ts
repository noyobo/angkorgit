import { describe, expect, test } from 'vitest';
import { buildBrowseUrl } from '@angkorgit/core';

describe('buildBrowseUrl', () => {
  test('returns null for invalid URLs', () => {
    expect(buildBrowseUrl('not-a-url')).toBeNull();
    expect(buildBrowseUrl('')).toBeNull();
  });

  test('GitHub HTTPS without branch', () => {
    expect(buildBrowseUrl('https://github.com/user/repo.git')).toBe(
      'https://github.com/user/repo',
    );
  });

  test('GitHub SSH with branch', () => {
    expect(buildBrowseUrl('git@github.com:user/repo.git', 'main')).toBe(
      'https://github.com/user/repo/tree/main',
    );
  });

  test('GitHub SSH with feature branch', () => {
    expect(buildBrowseUrl('git@github.com:user/repo.git', 'feature/foo')).toBe(
      'https://github.com/user/repo/tree/feature%2Ffoo',
    );
  });

  test('GitLab with subgroups and branch', () => {
    expect(buildBrowseUrl('https://gitlab.com/group/subgroup/project.git', 'develop')).toBe(
      'https://gitlab.com/group/subgroup/project/tree/develop',
    );
  });

  test('Bitbucket Cloud with branch', () => {
    expect(buildBrowseUrl('https://bitbucket.org/user/repo.git', 'main')).toBe(
      'https://bitbucket.org/user/repo/branch/main',
    );
  });

  test('Bitbucket Server with branch', () => {
    expect(
      buildBrowseUrl('https://bitbucket.company.com/scm/project/repo.git', 'feature/test'),
    ).toBe('https://bitbucket.company.com/scm/project/repo/browse?at=refs%2Fheads%2Ffeature%2Ftest');
  });

  test('Gitea-style forge with branch', () => {
    expect(buildBrowseUrl('https://gitea.example.com/owner/repo.git', 'main')).toBe(
      'https://gitea.example.com/owner/repo/tree/main',
    );
  });

  test('strips .git suffix', () => {
    expect(buildBrowseUrl('https://github.com/user/repo.git')).toBe(
      'https://github.com/user/repo',
    );
  });

  test('handles SSH URLs with custom ports', () => {
    // parseRemote strips ports from SSH URLs, which is correct behavior
    expect(buildBrowseUrl('ssh://git@github.com:443/user/repo.git', 'main')).toBe(
      'https://github.com/user/repo/tree/main',
    );
  });

  test('handles scp-style SSH URLs', () => {
    expect(buildBrowseUrl('git@gitlab.com:group/repo.git', 'main')).toBe(
      'https://gitlab.com/group/repo/tree/main',
    );
  });

  test('unknown forge returns repo root with null branch', () => {
    expect(buildBrowseUrl('https://unknown.example.com/owner/repo.git', null)).toBe(
      'https://unknown.example.com/owner/repo',
    );
  });

  test('unknown forge returns GitHub-style tree URL when branch provided', () => {
    // Unknown forges now get GitHub-style /tree/<branch> URLs (covers Gitea, Gogs, etc.)
    expect(buildBrowseUrl('https://unknown.example.com/owner/repo.git', 'main')).toBe(
      'https://unknown.example.com/owner/repo/tree/main',
    );
  });
});
