import { parseRemote } from './remote';

/**
 * Build a forge browse URL for a repository, optionally targeting a specific branch.
 * 
 * @param remoteUrl - Git remote URL (SSH, HTTPS, or scp format)
 * @param branch - Optional branch name to open (e.g. 'main', 'feature/foo')
 * @returns HTTPS browse URL for the repo root or branch tree, or null if the URL cannot be parsed
 * 
 * @example
 * buildBrowseUrl('git@github.com:user/repo.git', 'main')
 * // => 'https://github.com/user/repo/tree/main'
 * 
 * buildBrowseUrl('https://gitlab.com/group/subgroup/project.git')
 * // => 'https://gitlab.com/group/subgroup/project'
 */
export function buildBrowseUrl(remoteUrl: string, branch?: string | null): string | null {
  const remote = parseRemote(remoteUrl);
  if (!remote) return null;

  const hostname = remote.host.split(':')[0];
  const base = `${remote.scheme}://${remote.host}/${remote.path}`;

  // No branch: return repo root
  if (!branch) return base;

  // GitHub, GitLab, Gitea-style: /tree/<branch>
  if (hostname.includes('github') || hostname.includes('gitlab') || hostname.includes('gitea')) {
    return `${base}/tree/${encodeURIComponent(branch)}`;
  }

  // Bitbucket Cloud: /branch/<branch>
  if (hostname === 'bitbucket.org') {
    return `${base}/branch/${encodeURIComponent(branch)}`;
  }

  // Bitbucket Server: /browse?at=refs/heads/<branch>
  if (hostname.includes('bitbucket')) {
    const ref = encodeURIComponent(`refs/heads/${branch}`);
    return `${base}/browse?at=${ref}`;
  }

  // Unknown forge: return repo root as fallback
  return base;
}
