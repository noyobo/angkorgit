import { describe, expect, test } from 'bun:test';
import { webUrl, type WebUrlOptions } from '@angkorgit/core';

describe('webUrl - unified forge URL builder', () => {
  describe('invalid URLs', () => {
    test('returns null for unparseable URLs', () => {
      expect(webUrl('not-a-url', { kind: 'browse' })).toBeNull();
      expect(webUrl('', { kind: 'browse' })).toBeNull();
      expect(webUrl('/local/path', { kind: 'pr', branch: 'main' })).toBeNull();
    });

    test('returns null for unknown forges requesting PR URLs', () => {
      // Unknown forges return null for PR creation (no known URL pattern)
      expect(webUrl('https://gitea.example.com/owner/repo.git', { kind: 'pr', branch: 'main' })).toBeNull();
      expect(webUrl('https://sr.ht/~user/repo', { kind: 'pr', branch: 'main' })).toBeNull();
    });
  });

  describe('browse URLs', () => {
    describe('GitHub', () => {
      test('HTTPS without branch', () => {
        expect(webUrl('https://github.com/user/repo.git', { kind: 'browse' })).toBe(
          'https://github.com/user/repo',
        );
      });

      test('SSH with branch', () => {
        expect(webUrl('git@github.com:user/repo.git', { kind: 'browse', branch: 'main' })).toBe(
          'https://github.com/user/repo/tree/main',
        );
      });

      test('feature branch with slash', () => {
        expect(webUrl('git@github.com:user/repo.git', { kind: 'browse', branch: 'feature/foo' })).toBe(
          'https://github.com/user/repo/tree/feature%2Ffoo',
        );
      });

      test('scp-style SSH', () => {
        expect(webUrl('git@github.com:user/repo.git', { kind: 'browse', branch: 'main' })).toBe(
          'https://github.com/user/repo/tree/main',
        );
      });
    });

    describe('GitLab', () => {
      test('with subgroups and branch', () => {
        expect(
          webUrl('https://gitlab.com/group/subgroup/project.git', { kind: 'browse', branch: 'develop' }),
        ).toBe('https://gitlab.com/group/subgroup/project/tree/develop');
      });

      test('self-hosted without branch', () => {
        expect(webUrl('git@gitlab.example.com:team/api.git', { kind: 'browse' })).toBe(
          'https://gitlab.example.com/team/api',
        );
      });
    });

    describe('Bitbucket Cloud', () => {
      test('with branch', () => {
        expect(webUrl('https://bitbucket.org/user/repo.git', { kind: 'browse', branch: 'main' })).toBe(
          'https://bitbucket.org/user/repo/branch/main',
        );
      });

      test('without branch', () => {
        expect(webUrl('git@bitbucket.org:team/repo.git', { kind: 'browse' })).toBe(
          'https://bitbucket.org/team/repo',
        );
      });
    });

    describe('Bitbucket Server', () => {
      test('with branch', () => {
        expect(
          webUrl('https://bitbucket.company.com/scm/project/repo.git', {
            kind: 'browse',
            branch: 'feature/test',
          }),
        ).toBe('https://bitbucket.company.com/scm/project/repo/browse?at=refs%2Fheads%2Ffeature%2Ftest');
      });

      test('without branch', () => {
        expect(
          webUrl('ssh://git@bitbucket.corp.dev/scm/PROJ/repo.git', { kind: 'browse' }),
        ).toBe('https://bitbucket.corp.dev/scm/PROJ/repo');
      });
    });

    test('null branch behaves like omitted branch', () => {
      expect(webUrl('https://github.com/user/repo.git', { kind: 'browse', branch: null })).toBe(
        'https://github.com/user/repo',
      );
    });

    test('strips .git suffix', () => {
      expect(webUrl('https://github.com/user/repo.git', { kind: 'browse' })).toBe(
        'https://github.com/user/repo',
      );
    });
  });

  describe('file URLs', () => {
    describe('GitHub', () => {
      test('file with branch', () => {
        expect(
          webUrl('git@github.com:user/repo.git', {
            kind: 'file',
            filePath: 'src/index.ts',
            branch: 'main',
          }),
        ).toBe('https://github.com/user/repo/blob/main/src/index.ts');
      });

      test('nested file path', () => {
        expect(
          webUrl('https://github.com/user/repo.git', {
            kind: 'file',
            filePath: 'src/components/Button.tsx',
            branch: 'develop',
          }),
        ).toBe('https://github.com/user/repo/blob/develop/src/components/Button.tsx');
      });

      test('file with null branch uses HEAD', () => {
        expect(
          webUrl('git@github.com:user/repo.git', {
            kind: 'file',
            filePath: 'README.md',
            branch: null,
          }),
        ).toBe('https://github.com/user/repo/blob/HEAD/README.md');
      });
    });

    describe('GitLab', () => {
      test('file with branch', () => {
        expect(
          webUrl('https://gitlab.com/group/project.git', {
            kind: 'file',
            filePath: 'lib/util.ts',
            branch: 'main',
          }),
        ).toBe('https://gitlab.com/group/project/-/blob/main/lib/util.ts');
      });

      test('subgroup project', () => {
        expect(
          webUrl('git@gitlab.example.com:group/subgroup/api.git', {
            kind: 'file',
            filePath: 'config/app.yml',
            branch: 'production',
          }),
        ).toBe('https://gitlab.example.com/group/subgroup/api/-/blob/production/config/app.yml');
      });
    });

    describe('Bitbucket Cloud', () => {
      test('file with branch', () => {
        expect(
          webUrl('git@bitbucket.org:team/repo.git', {
            kind: 'file',
            filePath: 'src/main.rs',
            branch: 'feature/rust',
          }),
        ).toBe('https://bitbucket.org/team/repo/src/feature%2Frust/src/main.rs');
      });
    });

    describe('Bitbucket Server', () => {
      test('file with branch', () => {
        expect(
          webUrl('https://bitbucket.corp.dev/scm/PROJ/repo.git', {
            kind: 'file',
            filePath: 'docs/api.md',
            branch: 'main',
          }),
        ).toBe(
          'https://bitbucket.corp.dev/projects/PROJ/repos/repo/browse/docs/api.md?at=refs%2Fheads%2Fmain',
        );
      });
    });
  });

  describe('pull request URLs', () => {
    describe('GitHub', () => {
      test('HTTPS remote with feature branch', () => {
        expect(
          webUrl('https://github.com/cheat2001/angkorgit.git', { kind: 'pr', branch: 'feature/test1' }),
        ).toBe('https://github.com/cheat2001/angkorgit/compare/feature%2Ftest1?expand=1');
      });

      test('scp-style SSH remote', () => {
        expect(webUrl('git@github.com:cheat2001/angkorgit.git', { kind: 'pr', branch: 'main' })).toBe(
          'https://github.com/cheat2001/angkorgit/compare/main?expand=1',
        );
      });

      test('ssh:// protocol', () => {
        expect(webUrl('ssh://git@github.com/o/r', { kind: 'pr', branch: 'b' })).toBe(
          'https://github.com/o/r/compare/b?expand=1',
        );
      });
    });

    describe('GitLab', () => {
      test('self-hosted with feature branch', () => {
        expect(
          webUrl('https://gitlab.example.com/team/api.git', { kind: 'pr', branch: 'fix/login' }),
        ).toBe(
          'https://gitlab.example.com/team/api/-/merge_requests/new?merge_request%5Bsource_branch%5D=fix%2Flogin',
        );
      });

      test('non-standard port preserved', () => {
        expect(
          webUrl('https://gitlab.example.com:8443/team/api.git', { kind: 'pr', branch: 'dev' }),
        ).toBe(
          'https://gitlab.example.com:8443/team/api/-/merge_requests/new?merge_request%5Bsource_branch%5D=dev',
        );
      });

      test('plain http for LAN remotes', () => {
        expect(webUrl('http://gitlab.internal/team/api.git', { kind: 'pr', branch: 'dev' })).toBe(
          'http://gitlab.internal/team/api/-/merge_requests/new?merge_request%5Bsource_branch%5D=dev',
        );
      });
    });

    describe('Bitbucket Cloud', () => {
      test('standard pull request URL', () => {
        expect(webUrl('git@bitbucket.org:team/repo.git', { kind: 'pr', branch: 'dev' })).toBe(
          'https://bitbucket.org/team/repo/pull-requests/new?source=dev',
        );
      });
    });

    describe('Bitbucket Server', () => {
      test('/scm/ clone path', () => {
        expect(
          webUrl('https://bitbucket.company.com/scm/proj/repo.git', { kind: 'pr', branch: 'dev' }),
        ).toBe(
          'https://bitbucket.company.com/projects/PROJ/repos/repo/pull-requests?create&sourceBranch=refs%2Fheads%2Fdev',
        );
      });
    });

    test('empty branch returns null', () => {
      expect(webUrl('https://github.com/o/r.git', { kind: 'pr', branch: '' })).toBeNull();
    });

    test('drops SSH port from web link', () => {
      expect(webUrl('ssh://git@github.com:7999/o/r.git', { kind: 'pr', branch: 'b' })).toBe(
        'https://github.com/o/r/compare/b?expand=1',
      );
    });

    test('strips .git even behind trailing slash', () => {
      expect(webUrl('https://github.com/o/r.git/', { kind: 'pr', branch: 'b' })).toBe(
        'https://github.com/o/r/compare/b?expand=1',
      );
    });
  });

  describe('edge cases', () => {
    test('handles SSH URLs with custom ports', () => {
      expect(
        webUrl('ssh://git@github.com:443/user/repo.git', { kind: 'browse', branch: 'main' }),
      ).toBe('https://github.com/user/repo/tree/main');
    });

    test('normalizes trailing slashes', () => {
      expect(webUrl('https://github.com/user/repo/', { kind: 'browse' })).toBe(
        'https://github.com/user/repo',
      );
    });

    test('file paths with special characters are properly encoded', () => {
      expect(
        webUrl('git@github.com:user/repo.git', {
          kind: 'file',
          filePath: 'docs/API Guide.md',
          branch: 'main',
        }),
      ).toBe('https://github.com/user/repo/blob/main/docs/API%20Guide.md');
    });

    test('branch names with special characters are properly encoded', () => {
      expect(
        webUrl('git@github.com:user/repo.git', { kind: 'browse', branch: 'release/v1.0.0' }),
      ).toBe('https://github.com/user/repo/tree/release%2Fv1.0.0');
    });
  });

  describe('forge kind consistency', () => {
    test('uses parseForgeRemote for all kinds', () => {
      const githubUrl = 'git@github.com:user/repo.git';

      // All three kinds should use the same forge detection
      const browseResult = webUrl(githubUrl, { kind: 'browse', branch: 'main' });
      const fileResult = webUrl(githubUrl, { kind: 'file', filePath: 'file.ts', branch: 'main' });
      const prResult = webUrl(githubUrl, { kind: 'pr', branch: 'main' });

      // All should successfully detect GitHub
      expect(browseResult).toContain('github.com');
      expect(fileResult).toContain('github.com');
      expect(prResult).toContain('github.com');

      // All should use GitHub-specific URL patterns
      expect(browseResult).toContain('/tree/');
      expect(fileResult).toContain('/blob/');
      expect(prResult).toContain('/compare/');
    });

    test('rejects unparseable URLs consistently across all kinds', () => {
      const badUrl = 'not-a-valid-url';

      expect(webUrl(badUrl, { kind: 'browse' })).toBeNull();
      expect(webUrl(badUrl, { kind: 'file', filePath: 'file.ts', branch: 'main' })).toBeNull();
      expect(webUrl(badUrl, { kind: 'pr', branch: 'main' })).toBeNull();
    });
  });
});
