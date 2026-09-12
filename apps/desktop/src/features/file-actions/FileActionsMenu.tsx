import type { RemoteInfo } from '@angkorgit/core';
import { DropdownMenuItem, DropdownMenuSeparator } from '@angkorgit/design-system';
import { Copy, ExternalLink, Folder, Globe, Pencil } from 'lucide-react';
import type { ExternalEditor } from '@/features/settings/store';
import {
  buildFileRemoteUrl,
  copyAbsolutePathAction,
  copyRelativePathAction,
  type FileActionContext,
  getOpenInEditorLabel,
  getRevealLabel,
  openInEditorAction,
  openWithDefaultAction,
  revealFileAction,
  viewOnRemoteAction,
} from './operations';

export interface FileActionsMenuProps {
  repoPath: string;
  filePath: string;
  source: string;
  externalEditor: ExternalEditor;
  remotes: RemoteInfo[];
  headBranch: string | null;
  /**
   * Optional children to render before the file actions
   * (e.g., context-specific actions like Stage, Discard)
   */
  children?: React.ReactNode;
  /**
   * If true, renders a separator before the file actions section
   */
  separatorBefore?: boolean;
}

/**
 * FileActionsMenu - Reusable file action menu items
 *
 * Provides the standard file chrome actions (Reveal, Open in editor, View on remote, Copy path)
 * for use in dropdown menus across Working Copy, Diff Panel, and Inspector.
 *
 * Usage:
 * ```tsx
 * <DropdownMenuContent>
 *   <FileActionsMenu
 *     repoPath={path}
 *     filePath={file.path}
 *     source="working-copy"
 *     externalEditor={externalEditor}
 *     remotes={remotes}
 *     headBranch={headBranch}
 *   />
 * </DropdownMenuContent>
 * ```
 */
export function FileActionsMenu({
  repoPath,
  filePath,
  source,
  externalEditor,
  remotes,
  headBranch,
  children,
  separatorBefore = false,
}: FileActionsMenuProps) {
  const ctx: FileActionContext = { repoPath, filePath, source };
  const forgeFileUrl = buildFileRemoteUrl(filePath, remotes, headBranch);

  return (
    <>
      {children}
      {separatorBefore && <DropdownMenuSeparator />}
      <DropdownMenuItem onClick={() => void revealFileAction(ctx)}>
        <Folder /> {getRevealLabel()}
      </DropdownMenuItem>
      <DropdownMenuItem
        disabled={externalEditor === 'none'}
        onClick={() => void openInEditorAction(ctx, externalEditor)}
      >
        <Pencil /> {getOpenInEditorLabel(externalEditor)}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => void openWithDefaultAction(ctx)}>
        <ExternalLink /> Open with Default Program
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => void copyAbsolutePathAction(ctx)}>
        <Copy /> Copy File Path
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => void copyRelativePathAction(ctx)}>
        <Copy /> Copy Relative File Path
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        disabled={!forgeFileUrl}
        onClick={() => void viewOnRemoteAction(ctx, remotes, headBranch)}
      >
        <Globe /> View on Remote
      </DropdownMenuItem>
    </>
  );
}
