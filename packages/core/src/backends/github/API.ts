import { Base64 } from 'js-base64';
import initial from 'lodash/initial';
import last from 'lodash/last';
import partial from 'lodash/partial';
import result from 'lodash/result';
import trim from 'lodash/trim';
import trimStart from 'lodash/trimStart';
import { dirname } from 'path';

import { PreviewState } from '@staticcms/core/constants/enums';
import { WorkflowStatus } from '@staticcms/core/constants/publishModes';
import {
  APIError,
  EditorialWorkflowError,
  basename,
  generateContentKey,
  getAllResponses,
  localForage,
  parseContentKey,
  readFileMetadata,
  requestWithBackoff,
  throwOnConflictingBranches,
  unsentRequest,
} from '@staticcms/core/lib/util';
import {
  CMS_BRANCH_PREFIX,
  DEFAULT_PR_BODY,
  MERGE_COMMIT_MESSAGE,
  branchFromContentKey,
  isCMSLabel,
  labelToStatus,
  statusToLabel,
} from '@staticcms/core/lib/util/APIUtils';
import { GitHubCommitStatusState, PullRequestState } from './types';

import type { AuthScheme, DataFile, PersistOptions, UnpublishedEntry } from '@staticcms/core';
import type { ApiRequest, FetchError } from '@staticcms/core/lib/util';
import type AssetProxy from '@staticcms/core/valueObjects/AssetProxy';
import type { Semaphore } from 'semaphore';
import type {
  GitCreateCommitResponse,
  GitCreateRefResponse,
  GitCreateTreeParamsTree,
  GitCreateTreeResponse,
  GitGetBlobResponse,
  GitGetTreeResponse,
  GitHubAuthor,
  GitHubCommitStatus,
  GitHubCommitter,
  GitHubCompareCommit,
  GitHubCompareCommits,
  GitHubCompareFiles,
  GitHubPull,
  GitHubUser,
  GitListMatchingRefsResponse,
  GitListMatchingRefsResponseItem,
  GitUpdateRefResponse,
  PullsCreateResponse,
  PullsGetResponseLabelsItem,
  PullsListResponse,
  PullsMergeResponse,
  PullsUpdateBranchResponse,
  ReposCompareCommitsResponse,
  ReposCompareCommitsResponseFilesItem,
  ReposGetBranchResponse,
  ReposGetResponse,
  ReposListCommitsResponse,
  TreeFile,
} from './types';

export const API_NAME = 'GitHub';

export const MOCK_PULL_REQUEST = -1;

export interface Config {
  apiRoot?: string;
  token?: string;
  authScheme?: AuthScheme;
  authenticateAsGithubApp?: boolean;
  branch?: string;
  useOpenAuthoring?: boolean;
  openAuthoringEnabled?: boolean;
  repo?: string;
  originRepo?: string;
  squashMerges: boolean;
  initialWorkflowStatus: WorkflowStatus;
  cmsLabelPrefix: string;
  getUser: ({ token }: { token: string }) => Promise<GitHubUser>;
  getRepo: ({ token }: { token: string }) => Promise<ReposGetResponse>;
}

type Override<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U;

type TreeEntry = Override<GitCreateTreeParamsTree, { sha: string | null }>;

interface MetaDataObjects {
  entry: { path: string; sha: string };
  files: MediaFile[];
}

export interface Metadata {
  type: string;
  objects: MetaDataObjects;
  branch: string;
  status: string;
  collection: string;
  commitMessage: string;
  version?: string;
  user: string;
  title?: string;
  description?: string;
  timeStamp: string;
}

export interface BlobArgs {
  sha: string;
  repoURL: string;
  parseText: boolean;
}

type Param = string | number | undefined;

export type Options = RequestInit & {
  params?: Record<string, Param | Record<string, Param> | string[]>;
};

type MediaFile = {
  sha: string;
  path: string;
};

function withCmsLabel(pr: GitHubPull, cmsLabelPrefix: string) {
  return pr.labels.some(l => isCMSLabel(l.name, cmsLabelPrefix));
}

function getTreeFiles(files: GitHubCompareFiles) {
  const treeFiles = files.reduce(
    (arr, file) => {
      if (file.status === 'removed') {
        // delete the file
        arr.push({ sha: null, path: file.filename });
      } else if (file.status === 'renamed') {
        // delete the previous file
        arr.push({ sha: null, path: file.previous_filename as string });
        // add the renamed file
        arr.push({ sha: file.sha, path: file.filename });
      } else {
        // add the  file
        arr.push({ sha: file.sha, path: file.filename });
      }
      return arr;
    },
    [] as { sha: string | null; path: string }[],
  );

  return treeFiles;
}

export type Diff = {
  path: string;
  newFile: boolean;
  sha: string;
  binary: boolean;
};

export default class API {
  apiRoot: string;
  token: string;
  authScheme: AuthScheme;
  authenticateAsGithubApp: boolean;
  branch: string;
  useOpenAuthoring?: boolean;
  openAuthoringEnabled?: boolean;
  repo: string;
  originRepo: string;
  repoOwner: string;
  repoName: string;
  originRepoOwner: string;
  originRepoName: string;
  repoURL: string;
  originRepoURL: string;
  mergeMethod: string;
  initialWorkflowStatus: WorkflowStatus;
  cmsLabelPrefix: string;

  _userPromise?: Promise<GitHubUser>;
  _repoPromise?: Promise<ReposGetResponse>;
  _metadataSemaphore?: Semaphore;

  getUser: ({ token }: { token: string }) => Promise<GitHubUser>;
  getRepo: ({ token }: { token: string }) => Promise<ReposGetResponse>;
  commitAuthor?: {};

  constructor(config: Config) {
    this.apiRoot = config.apiRoot || 'https://api.github.com';
    this.token = config.token || '';
    this.authScheme = config.authScheme || 'token';
    this.authenticateAsGithubApp = config.authenticateAsGithubApp || false;
    this.branch = config.branch || 'main';
    this.useOpenAuthoring = config.useOpenAuthoring;
    this.repo = config.repo || '';
    this.originRepo = config.originRepo || this.repo;
    this.repoURL = `/repos/${this.repo}`;
    // when not in 'useOpenAuthoring' mode originRepoURL === repoURL
    this.originRepoURL = `/repos/${this.originRepo}`;

    const [repoParts, originRepoParts] = [this.repo.split('/'), this.originRepo.split('/')];
    this.repoOwner = repoParts[0];
    this.repoName = repoParts[1];

    this.originRepoOwner = originRepoParts[0];
    this.originRepoName = originRepoParts[1];

    this.mergeMethod = config.squashMerges ? 'squash' : 'merge';
    this.cmsLabelPrefix = config.cmsLabelPrefix;
    this.initialWorkflowStatus = config.initialWorkflowStatus;
    this.openAuthoringEnabled = config.openAuthoringEnabled;

    this.getUser = config.getUser;
    this.getRepo = config.getRepo;
  }

  static DEFAULT_COMMIT_MESSAGE = 'Automatically generated by Static CMS';

  user(): Promise<{ name: string; login: string; avatar_url?: string }> {
    if (!this._userPromise) {
      this._userPromise = this.getUser({ token: this.token });
    }
    return this._userPromise;
  }

  async hasWriteAccess() {
    try {
      const result: ReposGetResponse = await this.getRepo({ token: this.token });
      // update config repoOwner to avoid case sensitivity issues with GitHub
      this.repoOwner = result.owner.login;

      // Github App tokens won't have permissions set appropriately in the response, so we bypass that check
      if (this.authenticateAsGithubApp) {
        return true;
      }
      return result.permissions.push;
    } catch (error) {
      console.error('Problem fetching repo data from GitHub');
      throw error;
    }
  }

  reset() {
    // no op
  }

  requestHeaders(headers = {}) {
    const baseHeader: Record<string, string> = {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers,
    };

    if (this.token) {
      baseHeader.Authorization = `${this.authScheme} ${this.token}`;
      return Promise.resolve(baseHeader);
    }

    return Promise.resolve(baseHeader);
  }

  parseJsonResponse(response: Response) {
    return response.json().then(json => {
      if (!response.ok) {
        return Promise.reject(json);
      }

      return json;
    });
  }

  urlFor(path: string, options: Options) {
    const params = [];
    if (options.params) {
      for (const key in options.params) {
        params.push(`${key}=${encodeURIComponent(options.params[key] as string)}`);
      }
    }
    if (params.length) {
      path += `?${params.join('&')}`;
    }
    return this.apiRoot + path;
  }

  parseResponse(response: Response) {
    const contentType = response.headers.get('Content-Type');
    if (contentType && contentType.match(/json/)) {
      return this.parseJsonResponse(response);
    }
    const textPromise = response.text().then(text => {
      if (!response.ok) {
        return Promise.reject(text);
      }
      return text;
    });
    return textPromise;
  }

  handleRequestError(error: FetchError, responseStatus: number) {
    throw new APIError(error.message, responseStatus, API_NAME);
  }

  buildRequest(req: ApiRequest) {
    return req;
  }

  async request(
    path: string,
    options: Options = {},
    parser = (response: Response) => this.parseResponse(response),
  ) {
    options = { cache: 'no-cache', ...options };
    const headers = await this.requestHeaders(options.headers || {});
    const url = this.urlFor(path, options);
    let responseStatus = 500;

    try {
      const req = unsentRequest.fromFetchArguments(url, {
        ...options,
        headers,
      }) as unknown as ApiRequest;
      const response = await requestWithBackoff(this, req);
      responseStatus = response.status;
      const parsedResponse = await parser(response);
      return parsedResponse;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return this.handleRequestError(error, responseStatus);
    }
  }

  nextUrlProcessor() {
    return (url: string) => url;
  }

  async requestAllPages<T>(url: string, options: Options = {}) {
    options = { cache: 'no-cache', ...options };
    const headers = await this.requestHeaders(options.headers || {});
    const processedURL = this.urlFor(url, options);
    const allResponses = await getAllResponses(
      processedURL,
      { ...options, headers },
      'next',
      this.nextUrlProcessor(),
    );
    const pages: T[][] = await Promise.all(
      allResponses.map((res: Response) => this.parseResponse(res)),
    );
    return ([] as T[]).concat(...pages);
  }

  generateContentKey(collectionName: string, slug: string) {
    const contentKey = generateContentKey(collectionName, slug);
    if (this.useOpenAuthoring) {
      return `${this.repo}/${contentKey}`;
    }

    return contentKey;
  }

  getContentKeySlug(contentKey: string) {
    let key = contentKey;

    const parts = contentKey.split(this.repoName);
    if (parts.length > 1) {
      key = parts[1];
    }

    return key.replace(/^\//g, '').replace(/^cms\//g, '');
  }

  parseContentKey(contentKey: string) {
    return parseContentKey(this.getContentKeySlug(contentKey));
  }

  async readFile(
    path: string,
    sha?: string | null,
    {
      branch = this.branch,
      repoURL = this.repoURL,
      parseText = true,
    }: {
      branch?: string;
      repoURL?: string;
      parseText?: boolean;
    } = {},
  ) {
    if (!sha) {
      sha = await this.getFileSha(path, { repoURL, branch });
    }
    const content = await this.fetchBlobContent({ sha: sha as string, repoURL, parseText });
    return content;
  }

  async readFileMetadata(path: string, sha: string | null | undefined) {
    const fetchFileMetadata = async () => {
      try {
        const result: ReposListCommitsResponse = await this.request(
          `${this.originRepoURL}/commits`,
          {
            params: { path, sha: this.branch },
          },
        );
        const { commit } = result[0];
        return {
          author: commit.author.name || commit.author.email,
          updatedOn: commit.author.date,
        };
      } catch (e) {
        return { author: '', updatedOn: '' };
      }
    };
    const fileMetadata = await readFileMetadata(sha, fetchFileMetadata, localForage);
    return fileMetadata;
  }

  async fetchBlobContent({ sha, repoURL, parseText }: BlobArgs) {
    const result: GitGetBlobResponse = await this.request(`${repoURL}/git/blobs/${sha}`, {
      cache: 'force-cache',
    });

    if (parseText) {
      // treat content as a utf-8 string
      const content = Base64.decode(result.content);
      return content;
    } else {
      // treat content as binary and convert to blob
      const content = Base64.atob(result.content);
      const byteArray = new Uint8Array(content.length);
      for (let i = 0; i < content.length; i++) {
        byteArray[i] = content.charCodeAt(i);
      }
      const blob = new Blob([byteArray]);
      return blob;
    }
  }

  async listFiles(
    path: string,
    { repoURL = this.repoURL, branch = this.branch, depth = 1 } = {},
    folderSupport?: boolean,
  ): Promise<{ type: string; id: string; name: string; path: string; size: number }[]> {
    const folder = trim(path, '/');
    try {
      const result: GitGetTreeResponse = await this.request(
        `${repoURL}/git/trees/${branch}:${folder}`,
        {
          // GitHub API supports recursive=1 for getting the entire recursive tree
          // or omitting it to get the non-recursive tree
          params: depth > 1 ? { recursive: 1 } : {},
        },
      );
      return (
        result.tree
          // filter only files and/or folders up to the required depth
          .filter(
            file =>
              (!folderSupport ? file.type === 'blob' : true) &&
              file.path.split('/').length <= depth,
          )
          .map(file => ({
            type: file.type,
            id: file.sha,
            name: basename(file.path),
            path: `${folder}/${file.path}`,
            size: file.size!,
          }))
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err && err.status === 404) {
        console.info('[StaticCMS] This 404 was expected and handled appropriately.');
        return [];
      } else {
        throw err;
      }
    }
  }

  async persistFiles(dataFiles: DataFile[], mediaFiles: AssetProxy[], options: PersistOptions) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const files = [...mediaFiles, ...dataFiles] as unknown[] as TreeFile[];
    const uploadPromises = files.map(file => this.uploadBlob(file));
    await Promise.all(uploadPromises);

    if (options.useWorkflow) {
      /**
       * Editorial Workflow
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mediaFilesList = (mediaFiles as any[]).map(({ sha, path }) => ({
        path: trimStart(path, '/'),
        sha,
      }));
      const slug = dataFiles[0].slug;
      return this.editorialWorkflowGit(files, slug, mediaFilesList, options);
    }

    return this.getDefaultBranch()
      .then(branchData => this.updateTree(branchData.commit.sha, files))
      .then(changeTree => this.commit(options.commitMessage, changeTree))
      .then(response => this.patchBranch(this.branch, response.sha));
  }

  async getFileSha(path: string, { repoURL = this.repoURL, branch = this.branch } = {}) {
    /**
     * We need to request the tree first to get the SHA. We use extended SHA-1
     * syntax (<rev>:<path>) to get a blob from a tree without having to recurse
     * through the tree.
     */

    const pathArray = path.split('/');
    const filename = last(pathArray);
    const directory = initial(pathArray).join('/');
    const fileDataPath = encodeURIComponent(directory);
    const fileDataURL = `${repoURL}/git/trees/${branch}:${fileDataPath}`;

    const result: GitGetTreeResponse = await this.request(fileDataURL);
    const file = result.tree.find(file => file.path === filename);
    if (file) {
      return file.sha;
    } else {
      throw new APIError('Not Found', 404, API_NAME);
    }
  }

  async deleteFiles(paths: string[], message: string) {
    if (this.useOpenAuthoring) {
      return Promise.reject('Cannot delete published entries as an Open Authoring user!');
    }

    const branchData = await this.getDefaultBranch();
    const files = paths.map(path => ({ path, sha: null }));
    const changeTree = await this.updateTree(branchData.commit.sha, files);
    const commit = await this.commit(message, changeTree);
    await this.patchBranch(this.branch, commit.sha);
  }

  async createRef(type: string, name: string, sha: string) {
    const result: GitCreateRefResponse = await this.request(`${this.repoURL}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({ ref: `refs/${type}/${name}`, sha }),
    });
    return result;
  }

  async patchRef(type: string, name: string, sha: string, opts: { force?: boolean } = {}) {
    const force = opts.force || false;
    const result: GitUpdateRefResponse = await this.request(
      `${this.repoURL}/git/refs/${type}/${encodeURIComponent(name)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ sha, force }),
      },
    );
    return result;
  }

  deleteRef(type: string, name: string) {
    return this.request(`${this.repoURL}/git/refs/${type}/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
  }

  async getDefaultBranch() {
    const result: ReposGetBranchResponse = await this.request(
      `${this.originRepoURL}/branches/${encodeURIComponent(this.branch)}`,
    );
    return result;
  }

  assertCmsBranch(branchName: string) {
    return branchName.startsWith(`${CMS_BRANCH_PREFIX}/`);
  }

  patchBranch(branchName: string, sha: string, opts: { force?: boolean } = {}) {
    const force = opts.force || false;
    if (force && !this.assertCmsBranch(branchName)) {
      throw Error(`Only CMS branches can be force updated, cannot force update ${branchName}`);
    }
    return this.patchRef('heads', branchName, sha, { force });
  }

  async getHeadReference(head: string) {
    return `${this.repoOwner}:${head}`;
  }

  toBase64(str: string) {
    return Promise.resolve(Base64.encode(str));
  }

  async uploadBlob(item: { raw?: string; sha?: string; toBase64?: () => Promise<string> }) {
    const contentBase64 = await result(
      item,
      'toBase64',
      partial(this.toBase64, item.raw as string),
    );
    const response = await this.request(`${this.repoURL}/git/blobs`, {
      method: 'POST',
      body: JSON.stringify({
        content: contentBase64,
        encoding: 'base64',
      }),
    });
    item.sha = response.sha;
    return item;
  }

  async updateTree(
    baseSha: string,
    files: { path: string; sha: string | null; newPath?: string }[],
    branch = this.branch,
  ) {
    const toMove: { from: string; to: string; sha: string }[] = [];
    const tree = files.reduce((acc, file) => {
      const entry = {
        path: trimStart(file.path, '/'),
        mode: '100644',
        type: 'blob',
        sha: file.sha,
      } as TreeEntry;

      if (file.newPath) {
        toMove.push({ from: file.path, to: file.newPath, sha: file.sha as string });
      } else {
        acc.push(entry);
      }

      return acc;
    }, [] as TreeEntry[]);

    for (const { from, to, sha } of toMove) {
      const sourceDir = dirname(from);
      const destDir = dirname(to);
      const files = await this.listFiles(sourceDir, { branch, depth: 100 });
      for (const file of files) {
        // delete current path
        tree.push({
          path: file.path,
          mode: '100644',
          type: 'blob',
          sha: null,
        });
        // create in new path
        tree.push({
          path: file.path.replace(sourceDir, destDir),
          mode: '100644',
          type: 'blob',
          sha: file.path === from ? sha : file.id,
        });
      }
    }

    const newTree = await this.createTree(baseSha, tree);
    return { ...newTree, parentSha: baseSha };
  }

  async createTree(baseSha: string, tree: TreeEntry[]) {
    const result: GitCreateTreeResponse = await this.request(`${this.repoURL}/git/trees`, {
      method: 'POST',
      body: JSON.stringify({ base_tree: baseSha, tree }),
    });
    return result;
  }

  commit(message: string, changeTree: { parentSha?: string; sha: string }) {
    const parents = changeTree.parentSha ? [changeTree.parentSha] : [];
    return this.createCommit(message, changeTree.sha, parents);
  }

  async createCommit(
    message: string,
    treeSha: string,
    parents: string[],
    author?: GitHubAuthor,
    committer?: GitHubCommitter,
  ) {
    const result: GitCreateCommitResponse = await this.request(`${this.repoURL}/git/commits`, {
      method: 'POST',
      body: JSON.stringify({ message, tree: treeSha, parents, author, committer }),
    });
    return result;
  }

  /**
   * Editorial Workflow
   */
  async listUnpublishedBranches() {
    console.info(
      '%c Checking for Unpublished entries',
      'line-height: 30px;text-align: center;font-weight: bold',
    );

    let branches: string[];
    if (this.useOpenAuthoring) {
      // open authoring branches can exist without a pr
      const cmsBranches: GitListMatchingRefsResponse = await this.getOpenAuthoringBranches();
      branches = cmsBranches.map(b => b.ref.slice('refs/heads/'.length));
      // filter irrelevant branches
      const branchesWithFilter = await Promise.all(
        branches.map(b => this.filterOpenAuthoringBranches(b)),
      );
      branches = branchesWithFilter.filter(b => b.filter).map(b => b.branch);
    } else if (this.openAuthoringEnabled) {
      const cmsPullRequests = await this.getPullRequests(
        undefined,
        PullRequestState.Open,
        () => true,
      );
      branches = cmsPullRequests.map(pr => pr.head.ref);
    } else {
      const cmsPullRequests = await this.getPullRequests(undefined, PullRequestState.Open, pr =>
        withCmsLabel(pr, this.cmsLabelPrefix),
      );
      branches = cmsPullRequests.map(pr => pr.head.ref);
    }

    return branches;
  }

  async getOpenAuthoringBranches() {
    return this.requestAllPages<GitListMatchingRefsResponseItem>(
      `${this.repoURL}/git/refs/heads/cms/${this.repo}`,
    ).catch(() => [] as GitListMatchingRefsResponseItem[]);
  }

  filterOpenAuthoringBranches = async (branch: string) => {
    try {
      const pullRequest = await this.getBranchPullRequest(branch);
      const { state: currentState, merged_at: mergedAt } = pullRequest;
      if (
        pullRequest.number !== MOCK_PULL_REQUEST &&
        currentState === PullRequestState.Closed &&
        mergedAt
      ) {
        // pr was merged, delete branch
        await this.deleteBranch(branch);
        return { branch, filter: false };
      } else {
        return { branch, filter: true };
      }
    } catch (e) {
      return { branch, filter: false };
    }
  };

  async getPullRequests(
    head: string | undefined,
    state: PullRequestState,
    predicate: (pr: GitHubPull) => boolean,
  ) {
    const pullRequests: PullsListResponse = await this.requestAllPages(
      `${this.originRepoURL}/pulls`,
      {
        params: {
          ...(head ? { head: await this.getHeadReference(head) } : {}),
          base: this.branch,
          state,
          per_page: 100,
        },
      },
    );

    return pullRequests.filter(pr => {
      return pr.head.ref.startsWith(`${CMS_BRANCH_PREFIX}/`) && predicate(pr);
    });
  }

  deleteBranch(branchName: string) {
    return this.deleteRef('heads', branchName).catch((err: Error) => {
      // If the branch doesn't exist, then it has already been deleted -
      // deletion should be idempotent, so we can consider this a
      // success.
      if (err.message === 'Reference does not exist') {
        return Promise.resolve();
      }
      console.error(err);
      return Promise.reject(err);
    });
  }

  async getBranchPullRequest(branch: string) {
    if (this.useOpenAuthoring) {
      const pullRequests = await this.getPullRequests(branch, PullRequestState.All, () => true);
      return this.getOpenAuthoringPullRequest(branch, pullRequests);
    } else if (this.openAuthoringEnabled) {
      const pullRequests = await this.getPullRequests(undefined, PullRequestState.Open, pr => {
        return this.getContentKeySlug(pr.head.ref) === this.getContentKeySlug(branch);
      });
      if (pullRequests.length <= 0) {
        throw new EditorialWorkflowError('content is not under editorial workflow', true);
      }
      return pullRequests[0];
    } else {
      const pullRequests = await this.getPullRequests(branch, PullRequestState.Open, pr =>
        withCmsLabel(pr, this.cmsLabelPrefix),
      );
      if (pullRequests.length <= 0) {
        throw new EditorialWorkflowError('content is not under editorial workflow', true);
      }
      return pullRequests[0];
    }
  }

  async getOpenAuthoringPullRequest(branch: string, pullRequests: GitHubPull[]) {
    // we can't use labels when using open authoring
    // since the contributor doesn't have access to set labels
    // a branch without a pr (or a closed pr) means a 'draft' entry
    // a branch with an opened pr means a 'pending_review' entry
    const data = await this.getBranch(branch).catch(() => {
      throw new EditorialWorkflowError('content is not under editorial workflow', true);
    });
    // since we get all (open and closed) pull requests by branch name, make sure to filter by head sha
    const pullRequest = pullRequests.filter(pr => pr.head.sha === data.commit.sha)[0];
    // if no pull request is found for the branch we return a mocked one
    if (!pullRequest) {
      try {
        return {
          head: { sha: data.commit.sha },
          number: MOCK_PULL_REQUEST,
          labels: [{ name: statusToLabel(this.initialWorkflowStatus, this.cmsLabelPrefix) }],
          state: PullRequestState.Open,
        } as GitHubPull;
      } catch (e) {
        throw new EditorialWorkflowError('content is not under editorial workflow', true);
      }
    } else {
      pullRequest.labels = pullRequest.labels.filter(l => !isCMSLabel(l.name, this.cmsLabelPrefix));
      const cmsLabel =
        pullRequest.state === PullRequestState.Closed
          ? { name: statusToLabel(this.initialWorkflowStatus, this.cmsLabelPrefix) }
          : { name: statusToLabel(WorkflowStatus.PENDING_REVIEW, this.cmsLabelPrefix) };

      pullRequest.labels.push(cmsLabel as PullsGetResponseLabelsItem);
      return pullRequest;
    }
  }

  async getBranch(branch: string) {
    const result: ReposGetBranchResponse = await this.request(
      `${this.repoURL}/branches/${encodeURIComponent(branch)}`,
    );
    return result;
  }

  async retrieveUnpublishedEntryData(contentKey: string): Promise<UnpublishedEntry> {
    const { collection, slug } = this.parseContentKey(contentKey);
    const branch = branchFromContentKey(contentKey);
    const pullRequest = await this.getBranchPullRequest(branch);
    const [{ files }, pullRequestAuthor] = await Promise.all([
      this.getDifferences(this.branch, pullRequest.head.sha),
      this.getPullRequestAuthor(pullRequest),
    ]);
    const diffs = await Promise.all(files.map(file => this.diffFromFile(file)));
    const label = pullRequest.labels.find(l => isCMSLabel(l.name, this.cmsLabelPrefix)) as {
      name: string;
    };
    const status = label
      ? labelToStatus(label.name, this.cmsLabelPrefix)
      : WorkflowStatus.PENDING_REVIEW;
    const updatedAt = pullRequest.updated_at;

    return {
      collection,
      slug,
      status,
      diffs: diffs.map(d => ({ path: d.path, newFile: d.newFile, id: d.sha })),
      updatedAt,
      pullRequestAuthor,
      openAuthoring:
        !pullRequest.head.ref.includes(this.repo) && pullRequest.head.ref.includes(this.repoName),
    };
  }

  async getDifferences(from: string, to: string) {
    // retry this as sometimes GitHub returns an initial 404 on cross repo compare
    const attempts = this.useOpenAuthoring ? 10 : 1;
    for (let i = 1; i <= attempts; i++) {
      try {
        const result: ReposCompareCommitsResponse = await this.request(
          `${this.originRepoURL}/compare/${from}...${to}`,
        );
        return result;
      } catch (e) {
        if (i === attempts) {
          console.warn(`Reached maximum number of attempts '${attempts}' for getDifferences`);
          throw e;
        }
        await new Promise(resolve => setTimeout(resolve, i * 500));
      }
    }
    throw new APIError('Not Found', 404, API_NAME);
  }

  async getPullRequestAuthor(pullRequest: GitHubPull) {
    if (!pullRequest.user?.login) {
      return;
    }

    try {
      const user: GitHubUser = await this.request(`/users/${pullRequest.user.login}`);
      return user.name || user.login;
    } catch {
      return;
    }
  }

  // async since it is overridden in a child class
  async diffFromFile(diff: ReposCompareCommitsResponseFilesItem): Promise<Diff> {
    return {
      path: diff.filename,
      newFile: diff.status === 'added',
      sha: diff.sha,
      // media files diffs don't have a patch attribute, except svg files
      // renamed files don't have a patch attribute too
      binary: (diff.status !== 'renamed' && !diff.patch) || diff.filename.endsWith('.svg'),
    };
  }

  async publishUnpublishedEntry(collectionName: string, slug: string) {
    const contentKey = this.generateContentKey(collectionName, slug);
    const branch = branchFromContentKey(contentKey);

    const pullRequest = await this.getBranchPullRequest(branch);
    await this.mergePR(pullRequest);
    await this.deleteBranch(branch);
  }

  async mergePR(pullrequest: GitHubPull) {
    console.info('%c Merging PR', 'line-height: 30px;text-align: center;font-weight: bold');
    try {
      const result: PullsMergeResponse = await this.request(
        `${this.originRepoURL}/pulls/${pullrequest.number}/merge`,
        {
          method: 'PUT',
          body: JSON.stringify({
            commit_message: MERGE_COMMIT_MESSAGE,
            sha: pullrequest.head.sha,
            merge_method: this.mergeMethod,
          }),
        },
      );
      return result;
    } catch (error) {
      if (error instanceof APIError && error.status === 405) {
        return this.forceMergePR(pullrequest);
      } else {
        throw error;
      }
    }
  }

  async forceMergePR(pullRequest: GitHubPull) {
    const result = await this.getDifferences(pullRequest.base.sha, pullRequest.head.sha);
    const files = getTreeFiles(result.files as GitHubCompareFiles);

    let commitMessage = 'Automatically generated. Merged on Static CMS\n\nForce merge of:';
    files.forEach(file => {
      commitMessage += `\n* "${file.path}"`;
    });
    console.info(
      '%c Automatic merge not possible - Forcing merge.',
      'line-height: 30px;text-align: center;font-weight: bold',
    );
    return this.getDefaultBranch()
      .then(branchData => this.updateTree(branchData.commit.sha, files))
      .then(changeTree => this.commit(commitMessage, changeTree))
      .then(response => this.patchBranch(this.branch, response.sha));
  }

  async deleteUnpublishedEntry(collectionName: string, slug: string) {
    const contentKey = this.generateContentKey(collectionName, slug);
    const branch = branchFromContentKey(contentKey);

    const pullRequest = await this.getBranchPullRequest(branch);
    if (pullRequest.number !== MOCK_PULL_REQUEST) {
      await this.closePR(pullRequest.number);
    }
    await this.deleteBranch(branch);
  }

  async closePR(number: number) {
    console.info('%c Deleting PR', 'line-height: 30px;text-align: center;font-weight: bold');
    const result: PullsUpdateBranchResponse = await this.request(
      `${this.originRepoURL}/pulls/${number}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          state: PullRequestState.Closed,
        }),
      },
    );
    return result;
  }

  async updatePullRequestLabels(number: number, labels: string[]) {
    await this.request(`${this.repoURL}/issues/${number}/labels`, {
      method: 'PUT',
      body: JSON.stringify({ labels }),
    });
  }

  async setPullRequestStatus(pullRequest: GitHubPull, newStatus: WorkflowStatus) {
    const labels = [
      ...pullRequest.labels
        .filter(label => !isCMSLabel(label.name, this.cmsLabelPrefix))
        .map(l => l.name),
      statusToLabel(newStatus, this.cmsLabelPrefix),
    ];
    await this.updatePullRequestLabels(pullRequest.number, labels);
  }

  async createPR(title: string, head: string) {
    const result: PullsCreateResponse = await this.request(`${this.originRepoURL}/pulls`, {
      method: 'POST',
      body: JSON.stringify({
        title,
        body: DEFAULT_PR_BODY,
        head: await this.getHeadReference(head),
        base: this.branch,
      }),
    });

    return result;
  }

  async openPR(number: number) {
    console.info('%c Re-opening PR', 'line-height: 30px;text-align: center;font-weight: bold');
    const result: PullsUpdateBranchResponse = await this.request(
      `${this.originRepoURL}/pulls/${number}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          state: PullRequestState.Open,
        }),
      },
    );
    return result;
  }

  async updateUnpublishedEntryStatus(
    collectionName: string,
    slug: string,
    newStatus: WorkflowStatus,
  ) {
    const contentKey = this.generateContentKey(collectionName, slug);
    const branch = branchFromContentKey(contentKey);
    const pullRequest = await this.getBranchPullRequest(branch);

    if (!this.useOpenAuthoring) {
      await this.setPullRequestStatus(pullRequest, newStatus);
    } else {
      if (status === 'pending_publish') {
        throw new Error('Open Authoring entries may not be set to the status "pending_publish".');
      }

      if (pullRequest.number !== MOCK_PULL_REQUEST) {
        const { state } = pullRequest;
        if (state === PullRequestState.Open && newStatus === 'draft') {
          await this.closePR(pullRequest.number);
        }
        if (state === PullRequestState.Closed && newStatus === 'pending_review') {
          await this.openPR(pullRequest.number);
        }
      } else if (newStatus === 'pending_review') {
        const branch = branchFromContentKey(contentKey);
        // get the first commit message as the pr title
        const diff = await this.getDifferences(this.branch, await this.getHeadReference(branch));
        const title = diff.commits[0]?.commit?.message || API.DEFAULT_COMMIT_MESSAGE;
        await this.createPR(title, branch);
      }
    }
  }

  /**
   * Retrieve statuses for a given SHA. Unrelated to the editorial workflow
   * concept of entry "status". Useful for things like deploy preview links.
   */
  async getStatuses(collectionName: string, slug: string) {
    const contentKey = this.generateContentKey(collectionName, slug);
    const branch = branchFromContentKey(contentKey);
    const pullRequest = await this.getBranchPullRequest(branch);
    const sha = pullRequest.head.sha;
    const resp: { statuses: GitHubCommitStatus[] } = await this.request(
      `${this.originRepoURL}/commits/${sha}/status`,
    );
    return resp.statuses.map(s => ({
      context: s.context,
      target_url: s.target_url,
      state:
        s.state === GitHubCommitStatusState.Success ? PreviewState.Success : PreviewState.Other,
    }));
  }

  async editorialWorkflowGit(
    files: TreeFile[],
    slug: string,
    mediaFilesList: MediaFile[],
    options: PersistOptions,
  ) {
    const contentKey = this.generateContentKey(options.collectionName as string, slug);
    const branch = branchFromContentKey(contentKey);
    const unpublished = options.unpublished || false;
    if (!unpublished) {
      const branchData = await this.getDefaultBranch();
      const changeTree = await this.updateTree(branchData.commit.sha, files);
      const commitResponse = await this.commit(options.commitMessage, changeTree);

      if (this.useOpenAuthoring) {
        await this.createBranch(branch, commitResponse.sha);
      } else {
        const pr = await this.createBranchAndPullRequest(
          branch,
          commitResponse.sha,
          options.commitMessage,
        );
        await this.setPullRequestStatus(pr, options.status || this.initialWorkflowStatus);
      }
    } else {
      // Entry is already on editorial review workflow - commit to existing branch
      const { files: diffFiles } = await this.getDifferences(
        this.branch,
        await this.getHeadReference(branch),
      );

      const diffs = await Promise.all(diffFiles.map(file => this.diffFromFile(file)));
      // mark media files to remove
      const mediaFilesToRemove: { path: string; sha: string | null }[] = [];
      for (const diff of diffs.filter(d => d.binary)) {
        if (!mediaFilesList.some(file => file.path === diff.path)) {
          mediaFilesToRemove.push({ path: diff.path, sha: null });
        }
      }

      // rebase the branch before applying new changes
      const rebasedHead = await this.rebaseBranch(branch);
      const treeFiles = mediaFilesToRemove.concat(files);
      const changeTree = await this.updateTree(rebasedHead.sha, treeFiles, branch);
      const commit = await this.commit(options.commitMessage, changeTree);

      return this.patchBranch(branch, commit.sha, { force: true });
    }
  }

  async backupBranch(branchName: string) {
    try {
      const existingBranch = await this.getBranch(branchName);
      await this.createBranch(
        existingBranch.name.replace(
          new RegExp(`${CMS_BRANCH_PREFIX}/`),
          `${CMS_BRANCH_PREFIX}_${Date.now()}/`,
        ),
        existingBranch.commit.sha,
      );
    } catch (e) {
      console.warn(e);
    }
  }

  async createBranch(branchName: string, sha: string) {
    try {
      const result = await this.createRef('heads', branchName, sha);
      return result;
    } catch (e) {
      if (e instanceof Error) {
        const message = String(e.message || '');
        if (message === 'Reference update failed') {
          await throwOnConflictingBranches(branchName, name => this.getBranch(name), API_NAME);
        } else if (
          message === 'Reference already exists' &&
          branchName.startsWith(`${CMS_BRANCH_PREFIX}/`)
        ) {
          try {
            // this can happen if the branch wasn't deleted when the PR was merged
            // we backup the existing branch just in case and patch it with the new sha
            await this.backupBranch(branchName);
            const result = await this.patchBranch(branchName, sha, { force: true });
            return result;
          } catch (e) {
            console.error(e);
          }
        }
      }
      throw e;
    }
  }

  async createBranchAndPullRequest(branchName: string, sha: string, commitMessage: string) {
    await this.createBranch(branchName, sha);
    return this.createPR(commitMessage, branchName);
  }

  /**
   * Rebase an array of commits one-by-one, starting from a given base SHA
   */
  async rebaseCommits(baseCommit: GitHubCompareCommit, commits: GitHubCompareCommits) {
    /**
     * If the parent of the first commit already matches the target base,
     * return commits as is.
     */
    if (commits.length === 0 || commits[0].parents[0].sha === baseCommit.sha) {
      const head = last(commits) as GitHubCompareCommit;
      return head;
    } else {
      /**
       * Re-create each commit over the new base, applying each to the previous,
       * changing only the parent SHA and tree for each, but retaining all other
       * info, such as the author/committer data.
       */
      const newHeadPromise = commits.reduce((lastCommitPromise, commit) => {
        return lastCommitPromise.then(newParent => {
          const parent = newParent;
          const commitToRebase = commit;
          return this.rebaseSingleCommit(parent, commitToRebase);
        });
      }, Promise.resolve(baseCommit));
      return newHeadPromise;
    }
  }

  async rebaseSingleCommit(baseCommit: GitHubCompareCommit, commit: GitHubCompareCommit) {
    // first get the diff between the commits
    const result = await this.getDifferences(commit.parents[0].sha, commit.sha);
    const files = getTreeFiles(result.files as GitHubCompareFiles);

    // only update the tree if changes were detected
    if (files.length > 0) {
      // create a tree with baseCommit as the base with the diff applied
      const tree = await this.updateTree(baseCommit.sha, files);
      const { message, author, committer } = commit.commit;

      // create a new commit from the updated tree
      const newCommit = await this.createCommit(
        message,
        tree.sha,
        [baseCommit.sha],
        author,
        committer,
      );
      return newCommit as unknown as GitHubCompareCommit;
    } else {
      return commit;
    }
  }

  async rebaseBranch(branch: string) {
    try {
      // Get the diff between the default branch the published branch
      const { base_commit: baseCommit, commits } = await this.getDifferences(
        this.branch,
        await this.getHeadReference(branch),
      );
      // Rebase the branch based on the diff
      const rebasedHead = await this.rebaseCommits(baseCommit, commits);
      return rebasedHead;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getUnpublishedEntrySha(collection: string, slug: string) {
    const contentKey = this.generateContentKey(collection, slug);
    const branch = branchFromContentKey(contentKey);
    const pullRequest = await this.getBranchPullRequest(branch);
    return pullRequest.head.sha;
  }
}
