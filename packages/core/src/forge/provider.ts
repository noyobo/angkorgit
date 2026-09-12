import type { HttpClient } from '../ai/types';
import { bitbucketForgeProvider } from './providers/bitbucket';
import { githubForgeProvider } from './providers/github';
import { gitlabForgeProvider } from './providers/gitlab';
import type { ForgeRemote } from './remote';
import type {
  CreatePullRequestInput,
  ForgeUser,
  PullRequestCheckoutSpec,
  PullRequestInfo,
} from './types';

export interface ForgeProvider {
  readonly kind: ForgeRemote['kind'];
  readonly label: string;
  listOpenPullRequests(): Promise<PullRequestInfo[]>;
  defaultBranch(): Promise<string>;
  listReviewerCandidates(): Promise<ForgeUser[]>;
  createPullRequest(input: CreatePullRequestInput): Promise<PullRequestInfo>;
  checkoutSpec(pr: PullRequestInfo): PullRequestCheckoutSpec | null;
}

export function createForgeProvider(remote: ForgeRemote, http: HttpClient): ForgeProvider | null {
  switch (remote.kind) {
    case 'github':
      return githubForgeProvider(remote, http);
    case 'gitlab':
      return gitlabForgeProvider(remote, http);
    case 'bitbucket':
      return bitbucketForgeProvider(remote, http);
    case 'bitbucket-server':
    case 'unknown':
      return null;
  }
}
