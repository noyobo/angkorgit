import type { RemoteInfo } from '../git/types';

export interface ParsedRemote {
  scheme: string;
  host: string;
  path: string;
}

export function parseRemote(url: string): ParsedRemote | null {
  const trimmed = url.trim().replace(/\/$/, '').replace(/\.git$/, '');
  const web = trimmed.match(/^(https?):\/\/(?:[^@/]+@)?([^/]+)\/(.+)$/);
  if (web) return { scheme: web[1], host: web[2], path: web[3] };
  const ssh = trimmed.match(/^ssh:\/\/(?:[^@/]+@)?([^/:]+)(?::\d+)?\/(.+)$/);
  if (ssh) return { scheme: 'https', host: ssh[1], path: ssh[2] };
  const scp = trimmed.match(/^(?:[^@/]+@)([^:/]+):(.+)$/);
  if (scp) return { scheme: 'https', host: scp[1], path: scp[2] };
  return null;
}

export function pickForgeRemote(
  remotes: RemoteInfo[],
  headUpstream: string | null,
): RemoteInfo | null {
  if (remotes.length === 0) return null;
  const upstreamRemote = headUpstream?.split('/')[0];
  if (upstreamRemote) {
    const match = remotes.find((remote) => remote.name === upstreamRemote);
    if (match) return match;
  }
  return remotes.find((remote) => remote.name === 'origin') ?? remotes[0];
}

export type ForgeKind = 'github' | 'gitlab' | 'bitbucket' | 'bitbucket-server';

export interface ForgeRemote {
  kind: ForgeKind;
  scheme: string;
  host: string;
  owner: string;
  repo: string;
  webUrl: string;
}

const PROVIDER_KIND: Record<string, ForgeKind> = {
  github: 'github',
  gitlab: 'gitlab',
  'gitlab-self': 'gitlab',
  bitbucket: 'bitbucket',
};

// ponytail: one process-wide map, seeded from the accounts list. Per-window
// hosts would have to pass the map into parseForgeRemote instead.
const accountHostKinds = new Map<string, ForgeKind>();

/** Seed host → kind from connected accounts. Replaces the previous snapshot. */
export function registerForgeAccountHosts(
  accounts: Array<{ host: string; provider: string }>,
): void {
  accountHostKinds.clear();
  for (const account of accounts) {
    const kind = PROVIDER_KIND[account.provider];
    if (!kind) continue;
    const host = account.host.trim().toLowerCase().split(':')[0];
    if (host && !accountHostKinds.has(host)) accountHostKinds.set(host, kind);
  }
}

function detectForgeKind(hostname: string): ForgeKind | null {
  if (hostname.includes('github')) return 'github';
  if (hostname === 'bitbucket.org') return 'bitbucket';
  if (hostname.includes('bitbucket')) return 'bitbucket-server';
  if (hostname.includes('gitlab')) return 'gitlab';
  return null;
}

function forgeRemoteForKind(
  kind: ForgeKind,
  segments: string[],
  base: { scheme: string; host: string; webUrl: string },
): ForgeRemote | null {
  switch (kind) {
    case 'github':
    case 'bitbucket':
      if (segments.length !== 2) return null;
      return { kind, owner: segments[0], repo: segments[1], ...base };
    case 'bitbucket-server':
      if (segments[0] !== 'scm' || segments.length < 3) return null;
      return {
        kind,
        owner: segments[1],
        repo: segments.slice(2).join('/'),
        ...base,
      };
    case 'gitlab':
      if (segments.length < 2) return null;
      return {
        kind,
        owner: segments.slice(0, -1).join('/'),
        repo: segments[segments.length - 1],
        ...base,
      };
  }
}

export function parseForgeRemote(url: string): ForgeRemote | null {
  const remote = parseRemote(url);
  if (!remote) return null;
  const hostname = remote.host.split(':')[0];
  const kind = detectForgeKind(hostname) ?? accountHostKinds.get(hostname.toLowerCase()) ?? null;
  if (!kind) return null;
  const segments = remote.path.split('/').filter(Boolean);
  const webUrl = `${remote.scheme}://${remote.host}/${remote.path}`;
  return forgeRemoteForKind(kind, segments, {
    scheme: remote.scheme,
    host: remote.host,
    webUrl,
  });
}

export interface ForgeTarget {
  name: string;
  remote: ForgeRemote;
}

export function forgeTargets(remotes: RemoteInfo[], source: ForgeRemote): ForgeTarget[] {
  const seen = new Set<string>();
  const out: ForgeTarget[] = [];
  for (const entry of remotes) {
    const remote = parseForgeRemote(entry.url);
    if (!remote || remote.kind !== source.kind) continue;
    if (remote.host.toLowerCase() !== source.host.toLowerCase()) continue;
    const key = `${remote.owner}/${remote.repo}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ name: entry.name, remote });
  }
  return out;
}

export function defaultForgeTarget(targets: ForgeTarget[], sourceName: string): string {
  const upstream = targets.find((t) => t.name === 'upstream');
  if (upstream && upstream.name !== sourceName) return upstream.name;
  return targets.find((t) => t.name === sourceName)?.name ?? targets[0]?.name ?? sourceName;
}

export function sameForgeRepo(a: ForgeRemote, b: ForgeRemote): boolean {
  return (
    a.host.toLowerCase() === b.host.toLowerCase() &&
    a.owner.toLowerCase() === b.owner.toLowerCase() &&
    a.repo.toLowerCase() === b.repo.toLowerCase()
  );
}
