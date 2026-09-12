import { webUrl } from './webUrl';

/**
 * Build a forge pull request creation URL for a source branch.
 *
 * @deprecated This function is a thin wrapper around webUrl. Prefer using webUrl directly.
 *
 * @param remoteUrl - Git remote URL
 * @param branch - Source branch name
 * @returns PR creation URL or null if the remote cannot be parsed or forge is unknown
 */
export function pullRequestUrl(remoteUrl: string, branch: string): string | null {
  return webUrl(remoteUrl, { kind: 'pr', branch });
}
