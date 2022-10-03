import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloClient } from 'apollo-client';
import { setContext } from 'apollo-link-context';
import { createHttpLink } from 'apollo-link-http';
import { Map } from 'immutable';
import { Base64 } from 'js-base64';
import { flow, partial, result, trimStart } from 'lodash';
import { dirname } from 'path';

import {
  APIError,
  Cursor,
  localForage,
  parseLinkHeader,
  readFile,
  readFileMetadata,
  requestWithBackoff,
  responseParser,
  then,
  throwOnConflictingBranches,
  unsentRequest,
} from '../../lib/util';
import * as queries from './queries';

import type { NormalizedCacheObject } from 'apollo-cache-inmemory';
import type { ApolloQueryResult } from 'apollo-client';
import type { ApiRequest, FetchError } from '../../lib/util';
import type { AssetProxy, DataFile, ImplementationFile, PersistOptions } from '../../interface';

export const API_NAME = 'GitLab';

const NO_CACHE = 'no-cache';

export interface Config {
  apiRoot?: string;
  graphQLAPIRoot?: string;
  token?: string;
  branch?: string;
  repo?: string;
  useGraphQL?: boolean;
}

export interface CommitAuthor {
  name: string;
  email: string;
}

enum CommitAction {
  CREATE = 'create',
  DELETE = 'delete',
  MOVE = 'move',
  UPDATE = 'update',
}

type CommitItem = {
  base64Content?: string;
  path: string;
  oldPath?: string;
  action: CommitAction;
};

type FileEntry = { id: string; type: string; path: string; name: string };

interface CommitsParams {
  commit_message: string;
  branch: string;
  author_name?: string;
  author_email?: string;
  actions?: {
    action: string;
    file_path: string;
    previous_path?: string;
    content?: string;
    encoding?: string;
  }[];
}

type GitLabCommitDiff = {
  diff: string;
  new_path: string;
  old_path: string;
  new_file: boolean;
  renamed_file: boolean;
  deleted_file: boolean;
};

type GitLabRepo = {
  shared_with_groups: { group_access_level: number }[] | null;
  permissions: {
    project_access: { access_level: number } | null;
    group_access: { access_level: number } | null;
  };
};

type GitLabBranch = {
  name: string;
  developers_can_push: boolean;
  developers_can_merge: boolean;
  commit: {
    id: string;
  };
};

type GitLabCommitRef = {
  type: string;
  name: string;
};

type GitLabCommit = {
  id: string;
  short_id: string;
  title: string;
  author_name: string;
  author_email: string;
  authored_date: string;
  committer_name: string;
  committer_email: string;
  committed_date: string;
  created_at: string;
  message: string;
};

export function getMaxAccess(groups: { group_access_level: number }[]) {
  return groups.reduce((previous, current) => {
    if (current.group_access_level > previous.group_access_level) {
      return current;
    }
    return previous;
  }, groups[0]);
}

function batch<T>(items: T[], maxPerBatch: number, action: (items: T[]) => void) {
  for (let index = 0; index < items.length; index = index + maxPerBatch) {
    const itemsSlice = items.slice(index, index + maxPerBatch);
    action(itemsSlice);
  }
}

export default class API {
  apiRoot: string;
  graphQLAPIRoot: string;
  token: string | boolean;
  branch: string;
  repo: string;
  repoURL: string;
  commitAuthor?: CommitAuthor;

  graphQLClient?: ApolloClient<NormalizedCacheObject>;

  constructor(config: Config) {
    this.apiRoot = config.apiRoot || 'https://gitlab.com/api/v4';
    this.graphQLAPIRoot = config.graphQLAPIRoot || 'https://gitlab.com/api/graphql';
    this.token = config.token || false;
    this.branch = config.branch || 'main';
    this.repo = config.repo || '';
    this.repoURL = `/projects/${encodeURIComponent(this.repo)}`;
    if (config.useGraphQL === true) {
      this.graphQLClient = this.getApolloClient();
    }
  }

  getApolloClient() {
    const authLink = setContext((_, { headers }) => {
      return {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...headers,
          authorization: this.token ? `token ${this.token}` : '',
        },
      };
    });
    const httpLink = createHttpLink({ uri: this.graphQLAPIRoot });
    return new ApolloClient({
      link: authLink.concat(httpLink),
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: {
          fetchPolicy: NO_CACHE,
          errorPolicy: 'ignore',
        },
        query: {
          fetchPolicy: NO_CACHE,
          errorPolicy: 'all',
        },
      },
    });
  }

  reset() {
    return this.graphQLClient?.resetStore();
  }

  withAuthorizationHeaders = (req: ApiRequest) => {
    const withHeaders = unsentRequest.withHeaders(
      this.token ? { Authorization: `Bearer ${this.token}` } : {},
      req,
    );
    return Promise.resolve(withHeaders);
  };

  buildRequest = async (req: ApiRequest) => {
    const withRoot: ApiRequest = unsentRequest.withRoot(this.apiRoot)(req);
    const withAuthorizationHeaders = await this.withAuthorizationHeaders(withRoot);

    if (withAuthorizationHeaders.has('cache')) {
      return withAuthorizationHeaders;
    } else {
      const withNoCache: ApiRequest = unsentRequest.withNoCache(withAuthorizationHeaders);
      return withNoCache;
    }
  };

  request = async (req: ApiRequest): Promise<Response> => {
    try {
      return requestWithBackoff(this, req);
    } catch (err: any) {
      throw new APIError(err.message, null, API_NAME);
    }
  };

  responseToJSON = responseParser({ format: 'json', apiName: API_NAME });
  responseToBlob = responseParser({ format: 'blob', apiName: API_NAME });
  responseToText = responseParser({ format: 'text', apiName: API_NAME });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requestJSON = (req: ApiRequest) => this.request(req).then(this.responseToJSON) as Promise<any>;
  requestText = (req: ApiRequest) => this.request(req).then(this.responseToText) as Promise<string>;

  user = () => this.requestJSON('/user');

  WRITE_ACCESS = 30;
  MAINTAINER_ACCESS = 40;

  hasWriteAccess = async () => {
    const { shared_with_groups: sharedWithGroups, permissions }: GitLabRepo =
      await this.requestJSON(this.repoURL);

    const { project_access: projectAccess, group_access: groupAccess } = permissions;
    if (projectAccess && projectAccess.access_level >= this.WRITE_ACCESS) {
      return true;
    }
    if (groupAccess && groupAccess.access_level >= this.WRITE_ACCESS) {
      return true;
    }
    // check for group write permissions
    if (sharedWithGroups && sharedWithGroups.length > 0) {
      const maxAccess = getMaxAccess(sharedWithGroups);
      // maintainer access
      if (maxAccess.group_access_level >= this.MAINTAINER_ACCESS) {
        return true;
      }
      // developer access
      if (maxAccess.group_access_level >= this.WRITE_ACCESS) {
        // check permissions to merge and push
        try {
          const branch = await this.getDefaultBranch();
          if (branch.developers_can_merge && branch.developers_can_push) {
            return true;
          }
        } catch (e) {
          console.error('Failed getting default branch', e);
        }
      }
    }
    return false;
  };

  readFile = async (
    path: string,
    sha?: string | null,
    { parseText = true, branch = this.branch } = {},
  ): Promise<string | Blob> => {
    const fetchContent = async () => {
      const content = await this.request({
        url: `${this.repoURL}/repository/files/${encodeURIComponent(path)}/raw`,
        params: { ref: branch },
        cache: 'no-store',
      }).then<Blob | string>(parseText ? this.responseToText : this.responseToBlob);
      return content;
    };

    const content = await readFile(sha, fetchContent, localForage, parseText);
    return content;
  };

  async readFileMetadata(path: string, sha: string | null | undefined) {
    const fetchFileMetadata = async () => {
      try {
        const result: GitLabCommit[] = await this.requestJSON({
          url: `${this.repoURL}/repository/commits`,
          params: { path, ref_name: this.branch },
        });
        const commit = result[0];
        return {
          author: commit.author_name || commit.author_email,
          updatedOn: commit.authored_date,
        };
      } catch (e) {
        return { author: '', updatedOn: '' };
      }
    };
    const fileMetadata = await readFileMetadata(sha, fetchFileMetadata, localForage);
    return fileMetadata;
  }

  getCursorFromHeaders = (headers: Headers) => {
    const page = parseInt(headers.get('X-Page') as string, 10);
    const pageCount = parseInt(headers.get('X-Total-Pages') as string, 10);
    const pageSize = parseInt(headers.get('X-Per-Page') as string, 10);
    const count = parseInt(headers.get('X-Total') as string, 10);
    const links = parseLinkHeader(headers.get('Link'));
    const actions = Map(links)
      .keySeq()
      .flatMap(key =>
        (key === 'prev' && page > 1) ||
        (key === 'next' && page < pageCount) ||
        (key === 'first' && page > 1) ||
        (key === 'last' && page < pageCount)
          ? [key]
          : [],
      );
    return Cursor.create({
      actions,
      meta: { page, count, pageSize, pageCount },
      data: { links },
    });
  };

  getCursor = ({ headers }: { headers: Headers }) => this.getCursorFromHeaders(headers);

  // Gets a cursor without retrieving the entries by using a HEAD
  // request
  fetchCursor = (req: ApiRequest) =>
    flow([unsentRequest.withMethod('HEAD'), this.request, then(this.getCursor)])(req);

  fetchCursorAndEntries = (
    req: ApiRequest,
  ): Promise<{
    entries: FileEntry[];
    cursor: Cursor;
  }> =>
    flow([
      unsentRequest.withMethod('GET'),
      this.request,
      p =>
        Promise.all([
          p.then(this.getCursor),
          p.then(this.responseToJSON).catch((e: FetchError) => {
            if (e.status === 404) {
              return [];
            } else {
              throw e;
            }
          }),
        ]),
      then(([cursor, entries]: [Cursor, {}[]]) => ({ cursor, entries })),
    ])(req);

  listFiles = async (path: string, recursive = false) => {
    const { entries, cursor } = await this.fetchCursorAndEntries({
      url: `${this.repoURL}/repository/tree`,
      params: { path, ref: this.branch, recursive },
    });
    return {
      files: entries.filter(({ type }) => type === 'blob'),
      cursor,
    };
  };

  traverseCursor = async (cursor: Cursor, action: string) => {
    const link = cursor.data!.getIn(['links', action]) as ApiRequest;
    const { entries, cursor: newCursor } = await this.fetchCursorAndEntries(link);
    return {
      entries: entries.filter(({ type }) => type === 'blob'),
      cursor: newCursor,
    };
  };

  listAllFilesGraphQL = async (path: string, recursive: boolean, branch: String) => {
    const files: FileEntry[] = [];
    let blobsPaths;
    let cursor;
    do {
      blobsPaths = await this.graphQLClient!.query({
        query: queries.files,
        variables: { repo: this.repo, branch, path, recursive, cursor },
      });
      files.push(...blobsPaths.data.project.repository.tree.blobs.nodes);
      cursor = blobsPaths.data.project.repository.tree.blobs.pageInfo.endCursor;
    } while (blobsPaths.data.project.repository.tree.blobs.pageInfo.hasNextPage);

    return files;
  };

  readFilesGraphQL = async (files: ImplementationFile[]) => {
    const paths = files.map(({ path }) => path);

    type BlobResult = {
      project: { repository: { blobs: { nodes: { id: string; data: string }[] } } };
    };

    const blobPromises: Promise<ApolloQueryResult<BlobResult>>[] = [];
    batch(paths, 90, slice => {
      blobPromises.push(
        this.graphQLClient!.query({
          query: queries.blobs,
          variables: {
            repo: this.repo,
            branch: this.branch,
            paths: slice,
          },
          fetchPolicy: 'cache-first',
        }),
      );
    });

    type LastCommit = {
      id: string;
      authoredDate: string;
      authorName: string;
      author?: {
        name: string;
        username: string;
        publicEmail: string;
      };
    };

    type CommitResult = {
      project: { repository: { [tree: string]: { lastCommit: LastCommit } } };
    };

    const commitPromises: Promise<ApolloQueryResult<CommitResult>>[] = [];
    batch(paths, 8, slice => {
      commitPromises.push(
        this.graphQLClient!.query({
          query: queries.lastCommits(slice),
          variables: {
            repo: this.repo,
            branch: this.branch,
          },
          fetchPolicy: 'cache-first',
        }),
      );
    });

    const [blobsResults, commitsResults] = await Promise.all([
      (await Promise.all(blobPromises)).map(result => result.data.project.repository.blobs.nodes),
      (
        await Promise.all(commitPromises)
      ).map(
        result =>
          Object.values(result.data.project.repository)
            .map(({ lastCommit }) => lastCommit)
            .filter(Boolean) as LastCommit[],
      ),
    ]);

    const blobs = blobsResults.flat().map(result => result.data) as string[];
    const metadata = commitsResults.flat().map(({ author, authoredDate, authorName }) => ({
      author: author ? author.name || author.username || author.publicEmail : authorName,
      updatedOn: authoredDate,
    }));

    const filesWithData = files.map((file, index) => ({
      file: { ...file, ...metadata[index] },
      data: blobs[index],
    }));
    return filesWithData;
  };

  listAllFiles = async (path: string, recursive = false, branch = this.branch) => {
    if (this.graphQLClient) {
      return await this.listAllFilesGraphQL(path, recursive, branch);
    }
    const entries = [];
    // eslint-disable-next-line prefer-const
    let { cursor, entries: initialEntries } = await this.fetchCursorAndEntries({
      url: `${this.repoURL}/repository/tree`,
      // Get the maximum number of entries per page
      params: { path, ref: branch, per_page: 100, recursive },
    });
    entries.push(...initialEntries);
    while (cursor && cursor.actions!.has('next')) {
      const link = cursor.data!.getIn(['links', 'next']) as ApiRequest;
      const { cursor: newCursor, entries: newEntries } = await this.fetchCursorAndEntries(link);
      entries.push(...newEntries);
      cursor = newCursor;
    }
    return entries.filter(({ type }) => type === 'blob');
  };

  toBase64 = (str: string) => Promise.resolve(Base64.encode(str));
  fromBase64 = (str: string) => Base64.decode(str);

  async getBranch(branchName: string) {
    const branch: GitLabBranch = await this.requestJSON(
      `${this.repoURL}/repository/branches/${encodeURIComponent(branchName)}`,
    );
    return branch;
  }

  async uploadAndCommit(
    items: CommitItem[],
    { commitMessage = '', branch = this.branch, newBranch = false },
  ) {
    const actions = items.map(item => ({
      action: item.action,
      file_path: item.path,
      ...(item.oldPath ? { previous_path: item.oldPath } : {}),
      ...(item.base64Content !== undefined
        ? { content: item.base64Content, encoding: 'base64' }
        : {}),
    }));

    const commitParams: CommitsParams = {
      branch,
      commit_message: commitMessage,
      actions,
      ...(newBranch ? { start_branch: this.branch } : {}),
    };
    if (this.commitAuthor) {
      const { name, email } = this.commitAuthor;
      commitParams.author_name = name;
      commitParams.author_email = email;
    }

    try {
      const result = await this.requestJSON({
        url: `${this.repoURL}/repository/commits`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(commitParams),
      });
      return result;
    } catch (error: any) {
      const message = error.message || '';
      if (newBranch && message.includes(`Could not update ${branch}`)) {
        await throwOnConflictingBranches(branch, name => this.getBranch(name), API_NAME);
      }
      throw error;
    }
  }

  async getCommitItems(files: { path: string; newPath?: string }[], branch: string) {
    const items: CommitItem[] = await Promise.all(
      files.map(async file => {
        const [base64Content, fileExists] = await Promise.all([
          result(file, 'toBase64', partial(this.toBase64, (file as DataFile).raw)),
          this.isFileExists(file.path, branch),
        ]);

        let action = CommitAction.CREATE;
        let path = trimStart(file.path, '/');
        let oldPath = undefined;
        if (fileExists) {
          oldPath = file.newPath && path;
          action =
            file.newPath && file.newPath !== oldPath ? CommitAction.MOVE : CommitAction.UPDATE;
          path = file.newPath ? trimStart(file.newPath, '/') : path;
        }

        return {
          action,
          base64Content,
          path,
          oldPath,
        };
      }),
    );

    // move children
    for (const item of items.filter(i => i.oldPath && i.action === CommitAction.MOVE)) {
      const sourceDir = dirname(item.oldPath as string);
      const destDir = dirname(item.path);
      const children = await this.listAllFiles(sourceDir, true, branch);
      children
        .filter(f => f.path !== item.oldPath)
        .forEach(file => {
          items.push({
            action: CommitAction.MOVE,
            path: file.path.replace(sourceDir, destDir),
            oldPath: file.path,
          });
        });
    }

    return items;
  }

  async persistFiles(dataFiles: DataFile[], mediaFiles: AssetProxy[], options: PersistOptions) {
    const files = [...dataFiles, ...mediaFiles];
    const items = await this.getCommitItems(files, this.branch);
    return this.uploadAndCommit(items, {
      commitMessage: options.commitMessage,
    });
  }

  deleteFiles = (paths: string[], commitMessage: string) => {
    const branch = this.branch;
    const commitParams: CommitsParams = { commit_message: commitMessage, branch };
    if (this.commitAuthor) {
      const { name, email } = this.commitAuthor;
      commitParams.author_name = name;
      commitParams.author_email = email;
    }

    const items = paths.map(path => ({ path, action: CommitAction.DELETE }));
    return this.uploadAndCommit(items, {
      commitMessage,
    });
  };

  async getFileId(path: string, branch: string) {
    const request = await this.request({
      method: 'HEAD',
      url: `${this.repoURL}/repository/files/${encodeURIComponent(path)}`,
      params: { ref: branch },
    });

    const blobId = request.headers.get('X-Gitlab-Blob-Id') as string;
    return blobId;
  }

  async isFileExists(path: string, branch: string) {
    const fileExists = await this.requestText({
      method: 'HEAD',
      url: `${this.repoURL}/repository/files/${encodeURIComponent(path)}`,
      params: { ref: branch },
    })
      .then(() => true)
      .catch(error => {
        if (error instanceof APIError && error.status === 404) {
          return false;
        }
        throw error;
      });

    return fileExists;
  }

  async getDifferences(to: string, from = this.branch) {
    if (to === from) {
      return [];
    }
    const result: { diffs: GitLabCommitDiff[] } = await this.requestJSON({
      url: `${this.repoURL}/repository/compare`,
      params: {
        from,
        to,
      },
    });

    if (result.diffs.length >= 1000) {
      throw new APIError('Diff limit reached', null, API_NAME);
    }

    return result.diffs.map(d => {
      let status = 'modified';
      if (d.new_file) {
        status = 'added';
      } else if (d.deleted_file) {
        status = 'deleted';
      } else if (d.renamed_file) {
        status = 'renamed';
      }
      return {
        status,
        oldPath: d.old_path,
        newPath: d.new_path,
        newFile: d.new_file,
        path: d.new_path || d.old_path,
        binary: d.diff.startsWith('Binary') || /.svg$/.test(d.new_path),
      };
    });
  }

  async getDefaultBranch() {
    const branch: GitLabBranch = await this.getBranch(this.branch);
    return branch;
  }

  async isShaExistsInBranch(branch: string, sha: string) {
    const refs: GitLabCommitRef[] = await this.requestJSON({
      url: `${this.repoURL}/repository/commits/${sha}/refs`,
      params: {
        type: 'branch',
      },
    });
    return refs.some(r => r.name === branch);
  }
}
