import { webUrl } from './webUrl';

/**
 * Build a forge browse URL for a repository, optionally targeting a specific branch.
 * 
 * @deprecated This function is a thin wrapper around webUrl. Prefer using webUrl directly.
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
  return webUrl(remoteUrl, { kind: 'browse', branch });
}
