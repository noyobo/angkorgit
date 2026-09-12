import { webUrl } from './webUrl';

/**
 * Build a forge file URL for viewing a specific file at a branch/ref.
 *
 * @deprecated This function is a thin wrapper around webUrl. Prefer using webUrl directly.
 *
 * @param remoteUrl - Git remote URL
 * @param filePath - File path relative to repository root
 * @param branch - Branch name or null for HEAD
 * @returns Forge file URL or null if the remote cannot be parsed
 */
export function fileUrl(remoteUrl: string, filePath: string, branch: string | null): string | null {
  return webUrl(remoteUrl, { kind: 'file', filePath, branch });
}
