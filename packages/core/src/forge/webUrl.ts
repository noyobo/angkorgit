import { type ForgeRemote, parseForgeRemote } from './remote';

/**
 * Web URL options - unified interface for building forge URLs
 */
export type WebUrlOptions =
  | { kind: 'browse'; branch?: string | null }
  | { kind: 'file'; filePath: string; branch: string | null }
  | { kind: 'pr'; branch: string };

/**
 * Build a forge web URL - unified URL builder for all forge link types.
 *
 * This is the single source of truth for forge URL construction.
 * All URL building goes through parseForgeRemote, ensuring consistent
 * forge detection and eliminating duplicate hostname checks.
 *
 * @param remoteUrl - Git remote URL (SSH, HTTPS, or scp format)
 * @param options - URL kind and kind-specific parameters
 * @returns Forge web URL or null if the remote cannot be parsed
 *
 * @example
 * // Browse repository root
 * webUrl('git@github.com:user/repo.git', { kind: 'browse' })
 * // => 'https://github.com/user/repo'
 *
 * // Browse a specific branch
 * webUrl('git@github.com:user/repo.git', { kind: 'browse', branch: 'main' })
 * // => 'https://github.com/user/repo/tree/main'
 *
 * // File URL
 * webUrl('git@gitlab.com:group/project.git', {
 *   kind: 'file',
 *   filePath: 'src/index.ts',
 *   branch: 'main'
 * })
 * // => 'https://gitlab.com/group/project/-/blob/main/src/index.ts'
 *
 * // Pull request creation URL
 * webUrl('git@bitbucket.org:team/repo.git', {
 *   kind: 'pr',
 *   branch: 'feature/test'
 * })
 * // => 'https://bitbucket.org/team/repo/pull-requests/new?source=feature%2Ftest'
 */
export function webUrl(remoteUrl: string, options: WebUrlOptions): string | null {
  const remote = parseForgeRemote(remoteUrl);
  if (!remote) return null;

  switch (options.kind) {
    case 'browse':
      return buildBrowseUrl(remote, options.branch);
    case 'file':
      return buildFileUrl(remote, options.filePath, options.branch);
    case 'pr':
      return buildPullRequestUrl(remote, options.branch);
  }
}

/**
 * Build a browse URL for viewing the repository root or a branch tree
 */
function buildBrowseUrl(remote: ForgeRemote, branch?: string | null): string {
  const { webUrl } = remote;

  // No branch: return repo root
  if (!branch) return webUrl;

  // Build branch tree URL based on forge kind
  switch (remote.kind) {
    case 'github':
    case 'gitlab':
    case 'unknown':
      // Unknown forges use GitHub/GitLab-style /tree/<branch> pattern (covers Gitea, etc.)
      return `${webUrl}/tree/${encodeURIComponent(branch)}`;

    case 'bitbucket':
      return `${webUrl}/branch/${encodeURIComponent(branch)}`;

    case 'bitbucket-server':
      return `${webUrl}/browse?at=${encodeURIComponent(`refs/heads/${branch}`)}`;

    default:
      // Unreachable, but return repo root as ultimate fallback
      return webUrl;
  }
}

/**
 * Build a file URL for viewing a specific file at a given branch/ref
 */
function buildFileUrl(remote: ForgeRemote, filePath: string, branch: string | null): string {
  const { webUrl, kind, owner, repo } = remote;
  const ref = branch ?? 'HEAD';
  const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');

  switch (kind) {
    case 'github':
    case 'unknown':
      // Unknown forges use GitHub-style as fallback
      return `${webUrl}/blob/${encodeURIComponent(ref)}/${encodedPath}`;

    case 'gitlab':
      return `${webUrl}/-/blob/${encodeURIComponent(ref)}/${encodedPath}`;

    case 'bitbucket':
      return `${webUrl}/src/${encodeURIComponent(ref)}/${encodedPath}`;

    case 'bitbucket-server': {
      // Bitbucket Server uses a different URL structure
      const [projectKey, ...repoParts] = [owner, ...repo.split('/')];
      const repoSlug = repoParts.join('/');
      return `${remote.scheme}://${remote.host}/projects/${projectKey.toUpperCase()}/repos/${repoSlug}/browse/${encodedPath}?at=${encodeURIComponent(`refs/heads/${ref}`)}`;
    }

    default:
      // Unreachable, but use GitHub-style as ultimate fallback
      return `${webUrl}/blob/${encodeURIComponent(ref)}/${encodedPath}`;
  }
}

/**
 * Build a pull request creation URL for a source branch
 */
function buildPullRequestUrl(remote: ForgeRemote, branch: string): string | null {
  if (!branch) return null;

  const { webUrl, kind, owner, repo } = remote;
  const encoded = encodeURIComponent(branch);

  switch (kind) {
    case 'github':
      return `${webUrl}/compare/${encoded}?expand=1`;

    case 'gitlab':
      return `${webUrl}/-/merge_requests/new?merge_request%5Bsource_branch%5D=${encoded}`;

    case 'bitbucket':
      return `${webUrl}/pull-requests/new?source=${encoded}`;

    case 'bitbucket-server': {
      // Bitbucket Server uses a project/repo URL structure
      const [projectKey, ...repoParts] = [owner, ...repo.split('/')];
      const repoSlug = repoParts.join('/');
      const source = encodeURIComponent(`refs/heads/${branch}`);
      return `${remote.scheme}://${remote.host}/projects/${projectKey.toUpperCase()}/repos/${repoSlug}/pull-requests?create&sourceBranch=${source}`;
    }

    default:
      // Unknown forge: no PR URL
      return null;
  }
}
