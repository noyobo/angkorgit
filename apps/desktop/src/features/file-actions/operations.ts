import { pickForgeRemote, type RemoteInfo, webUrl } from '@angkorgit/core';
import { toast } from 'sonner';
import { ipc, openExternal } from '@/core/ipc';
import { logger } from '@/core/logger';
import { type ExternalEditor, externalEditorLabel } from '@/features/settings/store';
import { fileManagerLabel } from '@/shared/utils';

/**
 * operations.ts - Shared file actions
 *
 * Centralizes file chrome operations (Reveal, Open in editor, View on remote, Copy path)
 * that are shared across Working Copy, Diff Panel, and Inspector.
 *
 * Operations that belong to specific contexts (Stage, Discard) stay in their respective
 * components (WorkingCopyPanel).
 */

export interface FileActionContext {
  repoPath: string;
  filePath: string;
  source: string; // For analytics (e.g., 'working-copy', 'diff-panel', 'inspector')
}

/**
 * Reveal file in system file manager (Finder/Explorer/File Manager)
 */
export async function revealFileAction(ctx: FileActionContext): Promise<void> {
  const { repoPath, filePath, source } = ctx;
  void logger.click('reveal-file', source);

  const fullPath = `${repoPath}/${filePath}`;
  try {
    await ipc.revealPath(fullPath);
  } catch (error) {
    toast.error(`Could not reveal the file: ${(error as { message?: string }).message ?? error}`);
  }
}

/**
 * Open file in external editor (VS Code, Sublime, etc.)
 */
export async function openInEditorAction(
  ctx: FileActionContext,
  externalEditor: ExternalEditor,
): Promise<void> {
  const { repoPath, filePath, source } = ctx;
  void logger.click('open-in-editor', source);

  if (externalEditor === 'none') {
    toast.error('Configure an external editor in Settings first');
    return;
  }

  const fullPath = `${repoPath}/${filePath}`;
  try {
    await ipc.openInEditor(fullPath, externalEditor);
  } catch (error) {
    toast.error(`Could not open in editor: ${(error as { message?: string }).message ?? error}`);
  }
}

/**
 * Open file with system default program
 */
export async function openWithDefaultAction(ctx: FileActionContext): Promise<void> {
  const { repoPath, filePath, source } = ctx;
  void logger.click('open-with-default', source);

  const fullPath = `${repoPath}/${filePath}`;
  try {
    await ipc.openPath(fullPath);
  } catch (error) {
    toast.error(`Could not open the file: ${(error as { message?: string }).message ?? error}`);
  }
}

/**
 * Copy absolute file path to clipboard
 */
export async function copyAbsolutePathAction(ctx: FileActionContext): Promise<void> {
  const { repoPath, filePath, source } = ctx;
  void logger.click('copy-absolute-path', source);

  const fullPath = `${repoPath}/${filePath}`;
  await navigator.clipboard.writeText(fullPath);
  toast.success('Absolute path copied');
}

/**
 * Copy relative file path to clipboard
 */
export async function copyRelativePathAction(ctx: FileActionContext): Promise<void> {
  const { filePath, source } = ctx;
  void logger.click('copy-relative-path', source);

  await navigator.clipboard.writeText(filePath);
  toast.success('Relative path copied');
}

/**
 * Build forge URL for viewing file on remote
 * Returns null if the URL cannot be built
 */
export function buildFileRemoteUrl(
  filePath: string,
  remotes: RemoteInfo[],
  headBranch: string | null,
): string | null {
  if (!headBranch) return null;
  const remote = pickForgeRemote(remotes, null);
  if (!remote?.url) return null;
  return webUrl(remote.url, { kind: 'file', filePath, branch: headBranch });
}

/**
 * View file on remote forge (GitHub, GitLab, Bitbucket)
 */
export async function viewOnRemoteAction(
  ctx: FileActionContext,
  remotes: RemoteInfo[],
  headBranch: string | null,
): Promise<void> {
  const { filePath, source } = ctx;
  void logger.click('view-file-on-remote', source);

  const url = buildFileRemoteUrl(filePath, remotes, headBranch);
  if (!url) {
    toast.error('Could not build remote URL for this file');
    return;
  }

  await openExternal(url);
}

/**
 * UI helpers - Export labels for menu items
 */
export function getRevealLabel(): string {
  return `Reveal in ${fileManagerLabel()}`;
}

export function getOpenInEditorLabel(externalEditor: ExternalEditor): string {
  return `Open in ${externalEditorLabel(externalEditor)}`;
}
