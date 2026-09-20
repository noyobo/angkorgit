import { parseForgeRemote } from './remote';

export function pullRequestUrl(remoteUrl: string, branch: string): string | null {
  if (!branch) return null;
  const remote = parseForgeRemote(remoteUrl);
  if (!remote) return null;
  const encoded = encodeURIComponent(branch);
  switch (remote.kind) {
    case 'github':
      return `${remote.webUrl}/compare/${encoded}?expand=1`;
    case 'gitlab':
      return `${remote.webUrl}/-/merge_requests/new?merge_request%5Bsource_branch%5D=${encoded}`;
    case 'bitbucket':
      return `${remote.webUrl}/pull-requests/new?source=${encoded}`;
    case 'bitbucket-server': {
      const source = encodeURIComponent(`refs/heads/${branch}`);
      return `${remote.scheme}://${remote.host}/projects/${remote.owner.toUpperCase()}/repos/${remote.repo}/pull-requests?create&sourceBranch=${source}`;
    }
  }
}
