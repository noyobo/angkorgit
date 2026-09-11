import { parseForgeRemote, type ForgeRemote } from './remote';

export function fileUrl(
  remoteUrl: string,
  filePath: string,
  branch: string | null,
): string | null {
  const remote = parseForgeRemote(remoteUrl);
  if (!remote) return null;

  const ref = branch ?? 'HEAD';
  const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');

  return buildFileUrl(remote, encodedPath, ref);
}

function buildFileUrl(remote: ForgeRemote, encodedPath: string, ref: string): string {
  const { webUrl, kind, owner, repo } = remote;

  switch (kind) {
    case 'github':
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
      return `${webUrl}/blob/${encodeURIComponent(ref)}/${encodedPath}`;
  }
}
