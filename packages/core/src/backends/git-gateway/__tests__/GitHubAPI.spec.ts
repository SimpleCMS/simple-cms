import { WorkflowStatus } from '@staticcms/core/constants/publishModes';
import API from '../GitHubAPI';

import type { GitHubApiOptions } from '../GitHubAPI';

const createApi = (options: Partial<GitHubApiOptions> = {}) => {
  return new API({
    apiRoot: 'https://site.netlify.com/.netlify/git/github',
    tokenPromise: () => Promise.resolve('token'),
    squashMerges: true,
    initialWorkflowStatus: WorkflowStatus.DRAFT,
    cmsLabelPrefix: 'CMS',
    isLargeMedia: () => Promise.resolve(false),
    commitAuthor: { name: 'Bob' },
    getUser: () => Promise.reject('Unexpected call'),
    getRepo: () => Promise.reject('Unexpected call'),
    ...options,
  });
};

describe('github API', () => {
  describe('request', () => {
    const fetch = jest.fn();

    beforeEach(() => {
      global.fetch = fetch;
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should fetch url with authorization header', async () => {
      const api = createApi();

      fetch.mockResolvedValue({
        text: jest.fn().mockResolvedValue('some response'),
        ok: true,
        status: 200,
        headers: { get: () => '' },
      });
      const result = await api.request('/some-path');
      expect(result).toEqual('some response');
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('https://site.netlify.com/.netlify/git/github/some-path', {
        cache: 'no-cache',
        headers: {
          Authorization: 'Bearer token',
          'Content-Type': 'application/json; charset=utf-8',
        },
      });
    });

    it('should throw error on not ok response with message property', async () => {
      const api = createApi({
        apiRoot: 'https://site.netlify.com/.netlify/git/github',
        tokenPromise: () => Promise.resolve('token'),
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
          api: 'Git Gateway',
        }),
      );
    });

    it('should throw error on not ok response with msg property', async () => {
      const api = createApi({
        apiRoot: 'https://site.netlify.com/.netlify/git/github',
        tokenPromise: () => Promise.resolve('token'),
      });

      fetch.mockResolvedValue({
        text: jest.fn().mockResolvedValue({ msg: 'some error' }),
        ok: false,
        status: 404,
        headers: { get: () => '' },
      });

      await expect(api.request('some-path')).rejects.toThrow(
        expect.objectContaining({
          message: 'some error',
          name: 'API_ERROR',
          status: 404,
          api: 'Git Gateway',
        }),
      );
    });
  });

  describe('nextUrlProcessor', () => {
    it('should re-write github url', () => {
      const api = createApi({
        apiRoot: 'https://site.netlify.com/.netlify/git/github',
      });

      expect(api.nextUrlProcessor()('https://api.github.com/repositories/10000/pulls')).toEqual(
        'https://site.netlify.com/.netlify/git/github/pulls',
      );
    });
  });
});
