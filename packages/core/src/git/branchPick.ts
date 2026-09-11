export type DeleteSkipReason = 'head' | 'worktree';

export interface DeletableLocalRow {
  name: string;
  oid: string;
  time: number;
  ahead: number;
  skip: DeleteSkipReason | null;
  detail?: string;
}

export function classifyDeletableLocals(input: {
  locals: Array<{
    name: string;
    isHead: boolean;
    isRemote: boolean;
    targetOid: string;
    targetTime: number;
    ahead: number;
  }>;
  heldBy: Record<string, string>;
}): DeletableLocalRow[] {
  const rows: DeletableLocalRow[] = [];
  for (const branch of input.locals) {
    if (branch.isRemote) continue;
    const held = input.heldBy[branch.name];
    const skip: DeleteSkipReason | null = branch.isHead ? 'head' : held ? 'worktree' : null;
    rows.push({
      name: branch.name,
      oid: branch.targetOid,
      time: branch.targetTime,
      ahead: branch.ahead,
      skip,
      detail: skip === 'head' ? 'Checked out' : held ? `Checked out in ${held}` : undefined,
    });
  }
  rows.sort((a, b) => a.time - b.time || a.name.localeCompare(b.name));
  return rows;
}

export function namesOlderThan(
  rows: readonly DeletableLocalRow[],
  nowSeconds: number,
  days: number,
): string[] {
  const cutoff = nowSeconds - days * 86400;
  return rows.filter((row) => !row.skip && row.time > 0 && row.time < cutoff).map((row) => row.name);
}

export function remoteDeleteTarget(
  name: string,
  upstream: string | null,
  firstRemote: string | undefined,
): { remote: string; remoteName: string } | null {
  if (upstream) {
    const slash = upstream.indexOf('/');
    if (slash > 0) return { remote: upstream.slice(0, slash), remoteName: upstream.slice(slash + 1) };
  }
  return firstRemote ? { remote: firstRemote, remoteName: name } : null;
}
