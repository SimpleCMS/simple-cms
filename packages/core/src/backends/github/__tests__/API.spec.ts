import { Base64 } from 'js-base64';

import API from '../API';
import { WorkflowStatus } from '@staticcms/core/constants/publishModes';

import type { Options } from '../API';

describe('github API', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    global.fetch = jest.fn().mockRejectedValue(new Error('should not call fetch inside tests'));
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function mockAPI(api: API, responses: Record<string, (options: Options) => any>) {
    api.request = jest.fn().mockImplementation((path, options = {}) => {
      const normalizedPath = path.indexOf('?') !== -1 ? path.slice(0, path.indexOf('?')) : path;
      const response = responses[normalizedPath];
      return typeof response === 'function'
        ? Promise.resolve(response(options))
        : Promise.reject(new Error(`No response for path '${normalizedPath}'`));
    });
  }

  describe('updateTree', () => {
    it('should create tree with nested paths', async () => {
      const api = new API({
        branch: 'master',
        repo: 'owner/repo',
        squashMerges: false,
        initialWorkflowStatus: WorkflowStatus.DRAFT,
        cmsLabelPrefix: '',
        getUser: () => Promise.reject('Unexpected call'),
        getRepo: () => Promise.reject('Unexpected call'),
      });

      api.createTree = jest.fn().mockImplementation(() => Promise.resolve({ sha: 'newTreeSha' }));

      const files = [
        { path: '/static/media/new-image.jpeg', sha: null },
        { path: 'content/posts/new-post.md', sha: 'new-post.md' },
      ];

      const baseTreeSha = 'baseTreeSha';

      await expect(api.updateTree(baseTreeSha, files)).resolves.toEqual({
        sha: 'newTreeSha',
        parentSha: baseTreeSha,
      });

      expect(api.createTree).toHaveBeenCalledTimes(1);
      expect(api.createTree).toHaveBeenCalledWith(baseTreeSha, [
        {
          path: 'static/media/new-image.jpeg',
          mode: '100644',
          type: 'blob',
          sha: null,
        },
        {
          path: 'content/posts/new-post.md',
          mode: '100644',
          type: 'blob',
          sha: 'new-post.md',
        },
      ]);
    });
  });

  describe('request', () => {
    const fetch = jest.fn();
    beforeEach(() => {
      global.fetch = fetch;
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should fetch url with authorization header', async () => {
      const api = new API({
        branch: 'gh-pages',
        repo: 'my-repo',
        token: 'token',
        squashMerges: false,
        initialWorkflowStatus: WorkflowStatus.DRAFT,
        cmsLabelPrefix: '',
        getUser: () => Promise.reject('Unexpected call'),
        getRepo: () => Promise.reject('Unexpected call'),
      });

      fetch.mockResolvedValue({
        text: jest.fn().mockResolvedValue('some response'),
        ok: true,
        status: 200,
        headers: { get: () => '' },
      });
      const result = await api.request('/some-path');
      expect(result).toEqual('some response');
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('https://api.github.com/some-path', {
        cache: 'no-cache',
        headers: {
          Authorization: 'token token',
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
    });

    it('should fetch url with authorization header using custom auth scheme', async () => {
      const api = new API({
        branch: 'gh-pages',
        repo: 'my-repo',
        token: 'token',
        authScheme: 'Bearer',
        squashMerges: false,
        initialWorkflowStatus: WorkflowStatus.DRAFT,
        cmsLabelPrefix: '',
        getUser: () => Promise.reject('Unexpected call'),
        getRepo: () => Promise.reject('Unexpected call'),
      });

      fetch.mockResolvedValue({
        text: jest.fn().mockResolvedValue('some response'),
        ok: true,
        status: 200,
        headers: { get: () => '' },
      });
      const result = await api.request('/some-path');
      expect(result).toEqual('some response');
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('https://api.github.com/some-path', {
        cache: 'no-cache',
        headers: {
          Authorization: 'Bearer token',
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
    });

    it('should throw error on not ok response', async () => {
      const api = new API({
        branch: 'gh-pages',
        repo: 'my-repo',
        token: 'token',
        squashMerges: false,
        initialWorkflowStatus: WorkflowStatus.DRAFT,
        cmsLabelPrefix: '',
        getUser: () => Promise.reject('Unexpected call'),
        getRepo: () => Promise.reject('Unexpected call'),
      });

      fetch.mockResolvedValue({
        text: jest.fn().mockResolvedValue({ message: 'some error' }),
        ok: false,
        status: 404,
        headers: { get: () => '' },
      });

      await expect(api.request('some-path')).rejects.toThrow(
        expect.objectContaining({
          message: 'some error',
          name: 'API_ERROR',
          status: 404,
          api: 'GitHub',
        }),
      );
    });

    it('should allow overriding requestHeaders to return a promise ', async () => {
      const api = new API({
        branch: 'gh-pages',
        repo: 'my-repo',
        token: 'token',
        squashMerges: false,
        initialWorkflowStatus: WorkflowStatus.DRAFT,
        cmsLabelPrefix: '',
        getUser: () => Promise.reject('Unexpected call'),
        getRepo: () => Promise.reject('Unexpected call'),
      });

      api.requestHeaders = jest.fn().mockResolvedValue({
        Authorization: 'promise-token',
        'Content-Type': 'application/json; charset=utf-8',
      });

      fetch.mockResolvedValue({
        text: jest.fn().mockResolvedValue('some response'),
        ok: true,
        status: 200,
        headers: { get: () => '' },
      });
      const result = await api.request('/some-path');
      expect(result).toEqual('some response');
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('https://api.github.com/some-path', {
        cache: 'no-cache',
        headers: {
          Authorization: 'promise-token',
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
    });
  });

  describe('persistFiles', () => {
    it('should update tree, commit and patch branch when useWorkflow is false', async () => {
      const api = new API({
        branch: 'master',
        repo: 'owner/repo',
        squashMerges: false,
        initialWorkflowStatus: WorkflowStatus.DRAFT,
        cmsLabelPrefix: '',
        getUser: () => Promise.reject('Unexpected call'),
        getRepo: () => Promise.reject('Unexpected call'),
      });

      const responses = {
        // upload the file
        '/repos/owner/repo/git/blobs': () => ({ sha: 'new-file-sha' }),

        // get the branch
        '/repos/owner/repo/branches/master': () => ({ commit: { sha: 'root' } }),

        // create new tree
        '/repos/owner/repo/git/trees': (options: Options) => {
          const data = JSON.parse((options.body as string) ?? '');
          return { sha: data.base_tree };
        },

        // update the commit with the tree
        '/repos/owner/repo/git/commits': () => ({ sha: 'commit-sha' }),

        // patch the branch
        '/repos/owner/repo/git/refs/heads/master': () => ({}),
      };
      mockAPI(api, responses);

      const entry = {
        dataFiles: [
          {
            slug: 'entry',
            sha: 'abc',
            path: 'content/posts/new-post.md',
            raw: 'content',
          },
        ],
        assets: [],
      };
      await api.persistFiles(entry.dataFiles, entry.assets, { commitMessage: 'commitMessage' });

      expect(api.request).toHaveBeenCalledTimes(5);

      expect((api.request as jest.Mock).mock.calls[0]).toEqual([
        '/repos/owner/repo/git/blobs',
        {
          method: 'POST',
          body: JSON.stringify({
            content: Base64.encode(entry.dataFiles[0].raw),
            encoding: 'base64',
          }),
        },
      ]);

      expect((api.request as jest.Mock).mock.calls[1]).toEqual([
        '/repos/owner/repo/branches/master',
      ]);

      expect((api.request as jest.Mock).mock.calls[2]).toEqual([
        '/repos/owner/repo/git/trees',
        {
          body: JSON.stringify({
            base_tree: 'root',
            tree: [
              {
                path: 'content/posts/new-post.md',
                mode: '100644',
                type: 'blob',
                sha: 'new-file-sha',
              },
            ],
          }),
          method: 'POST',
        },
      ]);

      expect((api.request as jest.Mock).mock.calls[3]).toEqual([
        '/repos/owner/repo/git/commits',
        {
          body: JSON.stringify({
            message: 'commitMessage',
            tree: 'root',
            parents: ['root'],
          }),
          method: 'POST',
        },
      ]);

      expect((api.request as jest.Mock).mock.calls[4]).toEqual([
        '/repos/owner/repo/git/refs/heads/master',
        {
          body: JSON.stringify({
            sha: 'commit-sha',
            force: false,
          }),
          method: 'PATCH',
        },
      ]);
    });
  });

  describe('listFiles', () => {
    it('should get files by depth', async () => {
      const api = new API({
        branch: 'master',
        repo: 'owner/repo',
        squashMerges: false,
        initialWorkflowStatus: WorkflowStatus.DRAFT,
        cmsLabelPrefix: '',
        getUser: () => Promise.reject('Unexpected call'),
        getRepo: () => Promise.reject('Unexpected call'),
      });

      const tree = [
        {
          path: 'post.md',
          type: 'blob',
        },
        {
          path: 'dir1',
          type: 'tree',
        },
        {
          path: 'dir1/nested-post.md',
          type: 'blob',
        },
        {
          path: 'dir1/dir2',
          type: 'tree',
        },
        {
          path: 'dir1/dir2/nested-post.md',
          type: 'blob',
        },
      ];
      api.request = jest.fn().mockResolvedValue({ tree });

      await expect(api.listFiles('posts', { depth: 1 })).resolves.toEqual([
        {
          path: 'posts/post.md',
          type: 'blob',
          name: 'post.md',
        },
      ]);
      expect(api.request).toHaveBeenCalledTimes(1);
      expect(api.request).toHaveBeenCalledWith('/repos/owner/repo/git/trees/master:posts', {
        params: {},
      });

      jest.clearAllMocks();
      await expect(api.listFiles('posts', { depth: 2 })).resolves.toEqual([
        {
          path: 'posts/post.md',
          type: 'blob',
          name: 'post.md',
        },
        {
          path: 'posts/dir1/nested-post.md',
          type: 'blob',
          name: 'nested-post.md',
        },
      ]);
      expect(api.request).toHaveBeenCalledTimes(1);
      expect(api.request).toHaveBeenCalledWith('/repos/owner/repo/git/trees/master:posts', {
        params: { recursive: 1 },
      });

      jest.clearAllMocks();
      await expect(api.listFiles('posts', { depth: 3 })).resolves.toEqual([
        {
          path: 'posts/post.md',
          type: 'blob',
          name: 'post.md',
        },
        {
          path: 'posts/dir1/nested-post.md',
          type: 'blob',
          name: 'nested-post.md',
        },
        {
          path: 'posts/dir1/dir2/nested-post.md',
          type: 'blob',
          name: 'nested-post.md',
        },
      ]);
      expect(api.request).toHaveBeenCalledTimes(1);
      expect(api.request).toHaveBeenCalledWith('/repos/owner/repo/git/trees/master:posts', {
        params: { recursive: 1 },
      });
    });
    it('should get files and folders', async () => {
      const api = new API({
        branch: 'master',
        repo: 'owner/repo',
        squashMerges: false,
        initialWorkflowStatus: WorkflowStatus.DRAFT,
        cmsLabelPrefix: '',
        getUser: () => Promise.reject('Unexpected call'),
        getRepo: () => Promise.reject('Unexpected call'),
      });

      const tree = [
        {
          path: 'image.png',
          type: 'blob',
        },
        {
          path: 'dir1',
          type: 'tree',
        },
        {
          path: 'dir1/nested-image.png',
          type: 'blob',
        },
        {
          path: 'dir1/dir2',
          type: 'tree',
        },
        {
          path: 'dir1/dir2/nested-image.png',
          type: 'blob',
        },
      ];
      api.request = jest.fn().mockResolvedValue({ tree });

      await expect(api.listFiles('media', {}, true)).resolves.toEqual([
        {
          path: 'media/image.png',
          type: 'blob',
          name: 'image.png',
        },
        {
          path: 'media/dir1',
          type: 'tree',
          name: 'dir1',
        },
      ]);
      expect(api.request).toHaveBeenCalledTimes(1);
      expect(api.request).toHaveBeenCalledWith('/repos/owner/repo/git/trees/master:media', {
        params: {},
      });
    });
  });
});
