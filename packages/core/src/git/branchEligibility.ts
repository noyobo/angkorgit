export type EligibilityKind = 'stale' | 'age';
export type SkipReason = 'head' | 'worktree' | 'unpushed';

export interface EligibleBranch {
  name: string;
  oid: string;
  skip: SkipReason | null;
  detail?: string;
  time?: number;
  ahead?: number;
}

interface CommonInput {
  locals: Array<{
    name: string;
    isHead: boolean;
    isRemote: boolean;
    targetOid: string;
  }>;
  heldBy: Record<string, string>;
}

interface StaleInput extends CommonInput {
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
}

interface AgeInput extends CommonInput {
  locals: Array<{
    name: string;
    isHead: boolean;
    isRemote: boolean;
    targetOid: string;
    targetTime: number;
    ahead: number;
  }>;
}

function checkSkipReason(input: {
  isHead: boolean;
  heldBy: string | undefined;
  ahead?: number;
  kind: EligibilityKind;
}): { skip: SkipReason | null; detail?: string } {
  if (input.isHead) {
    return { skip: 'head', detail: 'Checked out' };
  }
  if (input.heldBy) {
    return { skip: 'worktree', detail: `Checked out in ${input.heldBy}` };
  }
  if (input.kind === 'stale' && input.ahead !== undefined && input.ahead > 0) {
    return { skip: 'unpushed', detail: 'Has unpushed commits' };
  }
  return { skip: null };
}

export function eligibleLocals(kind: 'stale', input: StaleInput): EligibleBranch[];
export function eligibleLocals(kind: 'age', input: AgeInput): EligibleBranch[];
export function eligibleLocals(
  kind: EligibilityKind,
  input: StaleInput | AgeInput,
): EligibleBranch[] {
  if (kind === 'stale') {
    return classifyStaleLocals(input as StaleInput);
  }
  return classifyDeletableLocals(input as AgeInput);
}

function classifyStaleLocals(input: StaleInput): EligibleBranch[] {
  const prefix = `${input.remote}/`;
  const remotes = new Set(input.remoteBranchNames);
  const rows: EligibleBranch[] = [];

  for (const branch of input.locals) {
    if (branch.isRemote) continue;

    const upstream = branch.upstream;
    if (!upstream?.startsWith(prefix)) continue;
    if (remotes.has(upstream)) continue;

    const ahead = input.aheadByName[branch.name] ?? branch.ahead;
    const held = input.heldBy[branch.name];
    const { skip, detail } = checkSkipReason({
      isHead: branch.isHead,
      heldBy: held,
      ahead,
      kind: 'stale',
    });

    rows.push({
      name: branch.name,
      oid: branch.targetOid,
      skip,
      detail,
    });
  }

  rows.sort(
    (a, b) => Number(Boolean(a.skip)) - Number(Boolean(b.skip)) || a.name.localeCompare(b.name),
  );
  return rows;
}

function classifyDeletableLocals(input: AgeInput): EligibleBranch[] {
  const rows: EligibleBranch[] = [];

  for (const branch of input.locals) {
    if (branch.isRemote) continue;

    const held = input.heldBy[branch.name];
    const { skip, detail } = checkSkipReason({
      isHead: branch.isHead,
      heldBy: held,
      kind: 'age',
    });

    rows.push({
      name: branch.name,
      oid: branch.targetOid,
      time: branch.targetTime,
      ahead: branch.ahead,
      skip,
      detail,
    });
  }

  rows.sort((a, b) => (a.time ?? 0) - (b.time ?? 0) || a.name.localeCompare(b.name));
  return rows;
}

export function namesOlderThan(
  rows: readonly EligibleBranch[],
  nowSeconds: number,
  days: number,
): string[] {
  const cutoff = nowSeconds - days * 86400;
  return rows
    .filter((row) => !row.skip && row.time && row.time > 0 && row.time < cutoff)
    .map((row) => row.name);
}

export function remoteDeleteTarget(
  name: string,
  upstream: string | null,
  firstRemote: string | undefined,
): { remote: string; remoteName: string } | null {
  if (upstream) {
    const slash = upstream.indexOf('/');
    if (slash > 0)
      return { remote: upstream.slice(0, slash), remoteName: upstream.slice(slash + 1) };
  }
  return firstRemote ? { remote: firstRemote, remoteName: name } : null;
}
