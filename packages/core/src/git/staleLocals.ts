export type StaleSkipReason = 'unpushed' | 'head' | 'worktree';

export interface StaleLocalRow {
  name: string;
  oid: string;
  skip: StaleSkipReason | null;
  detail?: string;
}

export function classifyStaleLocals(input: {
  locals: Array<{
    name: string;
    isHead: boolean;
    isRemote: boolean;
    upstream: string | null;
    ahead: number;
    targetOid: string;
  }>;
  remoteBranchNames: readonly string[];
  remote: string;
  aheadByName: Record<string, number>;
  heldBy: Record<string, string>;
}): StaleLocalRow[] {
  const prefix = `${input.remote}/`;
  const remotes = new Set(input.remoteBranchNames);
  const rows: StaleLocalRow[] = [];
  for (const branch of input.locals) {
    if (branch.isRemote) continue;
    const upstream = branch.upstream;
    if (!upstream?.startsWith(prefix)) continue;
    if (remotes.has(upstream)) continue;
    const ahead = input.aheadByName[branch.name] ?? branch.ahead;
    const held = input.heldBy[branch.name];
    if (branch.isHead) {
      rows.push({ name: branch.name, oid: branch.targetOid, skip: 'head', detail: 'Checked out' });
    } else if (held) {
      rows.push({
        name: branch.name,
        oid: branch.targetOid,
        skip: 'worktree',
        detail: `Checked out in ${held}`,
      });
    } else if (ahead > 0) {
      rows.push({
        name: branch.name,
        oid: branch.targetOid,
        skip: 'unpushed',
        detail: 'Has unpushed commits',
      });
    } else {
      rows.push({ name: branch.name, oid: branch.targetOid, skip: null });
    }
  }
  rows.sort((a, b) => Number(Boolean(a.skip)) - Number(Boolean(b.skip)) || a.name.localeCompare(b.name));
  return rows;
}
