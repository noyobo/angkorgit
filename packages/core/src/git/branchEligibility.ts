/**
 * Branch deletion eligibility classifier.
 * 
 * Consolidates stale-local detection and age-based deletion filtering
 * into a single, testable TypeScript module. Replaces the former Rust
 * `list_stale_locals` (which was wired to IPC but unused) and unifies
 * the two prior TS classifiers (staleLocals.ts, branchPick.ts).
 */

export type EligibilityKind = 'stale' | 'age';
export type SkipReason = 'head' | 'worktree' | 'unpushed';

export interface BranchInput {
  name: string;
  isHead: boolean;
  isRemote: boolean;
  upstream: string | null;
  ahead: number;
  targetOid: string;
  targetTime: number;
}

export interface EligibleBranch {
  name: string;
  oid: string;
  time: number;
  ahead: number;
  skip: SkipReason | null;
  detail?: string;
}

export interface EligibilityInput {
  kind: EligibilityKind;
  locals: BranchInput[];
  heldBy: Record<string, string>;
  remoteBranchNames?: readonly string[];
  remote?: string;
  aheadByName?: Record<string, number>;
}

/**
 * Classify local branches for deletion eligibility.
 * 
 * **Kind 'stale'**: Branches whose upstream is gone from the remote
 * (typical after fetch+prune). Requires `remoteBranchNames` and `remote`.
 * 
 * **Kind 'age'**: All local branches, sorted by commit time (oldest first).
 * Use with `namesOlderThan` to filter by age threshold.
 * 
 * **Skip reasons**:
 * - `head`: Checked out in the current worktree
 * - `worktree`: Checked out in another worktree
 * - `unpushed`: Has commits ahead of upstream (stale kind only)
 * 
 * Rows with `skip !== null` should not be deleted without user confirmation.
 * 
 * @example
 * // Stale branch detection (fetch+prune workflow)
 * const stale = eligibleLocals({
 *   kind: 'stale',
 *   locals: branches,
 *   remoteBranchNames: branches.filter(b => b.isRemote).map(b => b.name),
 *   remote: 'origin',
 *   aheadByName,
 *   heldBy,
 * });
 * 
 * @example
 * // Age-based cleanup
 * const old = eligibleLocals({ kind: 'age', locals: branches, heldBy });
 * const toDelete = namesOlderThan(old, Date.now() / 1000, 90);
 */
export function eligibleLocals(input: EligibilityInput): EligibleBranch[] {
  const rows: EligibleBranch[] = [];

  if (input.kind === 'stale') {
    if (!input.remoteBranchNames || !input.remote) {
      throw new Error("kind 'stale' requires remoteBranchNames and remote");
    }
    const prefix = `${input.remote}/`;
    const remotes = new Set(input.remoteBranchNames);

    for (const branch of input.locals) {
      if (branch.isRemote) continue;
      const upstream = branch.upstream;
      if (!upstream?.startsWith(prefix)) continue;
      if (remotes.has(upstream)) continue;

      const ahead = input.aheadByName?.[branch.name] ?? branch.ahead;
      const held = input.heldBy[branch.name];

      if (branch.isHead) {
        rows.push({
          name: branch.name,
          oid: branch.targetOid,
          time: branch.targetTime,
          ahead,
          skip: 'head',
          detail: 'Checked out',
        });
      } else if (held) {
        rows.push({
          name: branch.name,
          oid: branch.targetOid,
          time: branch.targetTime,
          ahead,
          skip: 'worktree',
          detail: `Checked out in ${held}`,
        });
      } else if (ahead > 0) {
        rows.push({
          name: branch.name,
          oid: branch.targetOid,
          time: branch.targetTime,
          ahead,
          skip: 'unpushed',
          detail: 'Has unpushed commits',
        });
      } else {
        rows.push({
          name: branch.name,
          oid: branch.targetOid,
          time: branch.targetTime,
          ahead,
          skip: null,
        });
      }
    }

    rows.sort((a, b) => Number(Boolean(a.skip)) - Number(Boolean(b.skip)) || a.name.localeCompare(b.name));
  } else {
    for (const branch of input.locals) {
      if (branch.isRemote) continue;
      const held = input.heldBy[branch.name];
      const skip: SkipReason | null = branch.isHead ? 'head' : held ? 'worktree' : null;
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
  }

  return rows;
}

/**
 * Filter eligible branches by age threshold.
 * 
 * Returns names of branches older than `days`, excluding those with `skip` reasons.
 * 
 * @param rows - Eligible branches from `eligibleLocals({ kind: 'age', ... })`
 * @param nowSeconds - Current time in seconds (Date.now() / 1000)
 * @param days - Age threshold in days
 * 
 * @example
 * const candidates = eligibleLocals({ kind: 'age', locals, heldBy });
 * const stale = namesOlderThan(candidates, Date.now() / 1000, 90);
 */
export function namesOlderThan(
  rows: readonly EligibleBranch[],
  nowSeconds: number,
  days: number,
): string[] {
  const cutoff = nowSeconds - days * 86400;
  return rows.filter((row) => !row.skip && row.time > 0 && row.time < cutoff).map((row) => row.name);
}

/**
 * Determine the remote target for deleting a branch's remote counterpart.
 * 
 * **Strategy**:
 * - If the branch has an upstream, parse the remote from it (e.g., `origin/main` → `origin`)
 * - Otherwise, fall back to `firstRemote` (typically `remotes[0].name`)
 * 
 * Returns `null` when no remote can be determined.
 * 
 * @example
 * const target = remoteDeleteTarget('feature', 'origin/feature', 'origin');
 * // { remote: 'origin', remoteName: 'feature' }
 */
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
