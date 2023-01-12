import {
  ADD_ASSET,
  ADD_ASSETS,
  LOAD_ASSET_FAILURE,
  LOAD_ASSET_REQUEST,
  LOAD_ASSET_SUCCESS,
  REMOVE_ASSET,
} from '../constants';
import { isAbsolutePath } from '../lib/util';
import { selectMediaFilePath } from '../lib/util/media.util';
import { selectMediaFileByPath } from '../reducers/selectors/mediaLibrary';
import { createAssetProxy } from '../valueObjects/AssetProxy';
import { getMediaDisplayURL, getMediaFile, waitForMediaLibraryToLoad } from './mediaLibrary';

import type { AnyAction } from 'redux';
import type { ThunkDispatch } from 'redux-thunk';
import type { BaseField, Collection, Entry, Field, UnknownField } from '../interface';
import type { RootState } from '../store';
import type AssetProxy from '../valueObjects/AssetProxy';

export function addAssets(assets: AssetProxy[]) {
  return { type: ADD_ASSETS, payload: assets } as const;
}

export function addAsset(assetProxy: AssetProxy) {
  return { type: ADD_ASSET, payload: assetProxy } as const;
}

export function removeAsset(path: string) {
  return { type: REMOVE_ASSET, payload: path } as const;
}

export function loadAssetRequest(path: string) {
  return { type: LOAD_ASSET_REQUEST, payload: { path } } as const;
}

export function loadAssetSuccess(path: string) {
  return { type: LOAD_ASSET_SUCCESS, payload: { path } } as const;
}

export function loadAssetFailure(path: string, error: Error) {
  return { type: LOAD_ASSET_FAILURE, payload: { path, error } } as const;
}

export const emptyAsset = createAssetProxy({
  path: 'empty.svg',
  file: new File([`<svg xmlns="http://www.w3.org/2000/svg"></svg>`], 'empty.svg', {
    type: 'image/svg+xml',
  }),
});

async function loadAsset(
  resolvedPath: string,
  dispatch: ThunkDispatch<RootState, {}, AnyAction>,
  getState: () => RootState,
): Promise<AssetProxy> {
  try {
    dispatch(loadAssetRequest(resolvedPath));
    // load asset url from backend
    await waitForMediaLibraryToLoad(dispatch, getState());
    const file = selectMediaFileByPath(getState(), resolvedPath);

    let asset: AssetProxy;
    if (file) {
      const url = await getMediaDisplayURL(dispatch, getState(), file);
      asset = createAssetProxy({ path: resolvedPath, url: url || resolvedPath });
      dispatch(addAsset(asset));
    } else {
      const { url } = await getMediaFile(getState(), resolvedPath);
      asset = createAssetProxy({ path: resolvedPath, url });
      dispatch(addAsset(asset));
    }
    dispatch(loadAssetSuccess(resolvedPath));
    return asset;
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof Error) {
      dispatch(loadAssetFailure(resolvedPath, error));
    }
    return emptyAsset;
  }
}

const promiseCache: Record<string, Promise<AssetProxy>> = {};

export function getAsset<F extends BaseField = UnknownField>(
  collection: Collection<F> | null | undefined,
  entry: Entry | null | undefined,
  path: string,
  field?: F,
) {
  return (
    dispatch: ThunkDispatch<RootState, {}, AnyAction>,
    getState: () => RootState,
  ): Promise<AssetProxy> => {
    const state = getState();
    if (!state.config.config) {
      return Promise.resolve(emptyAsset);
    }

    const resolvedPath = selectMediaFilePath(
      state.config.config,
      collection as Collection,
      entry,
      path,
      field as Field,
    );
    let { asset, isLoading, error } = state.medias[resolvedPath] || {};
    if (isLoading) {
      return promiseCache[resolvedPath];
    }

    if (asset) {
      // There is already an AssetProxy in memory for this path. Use it.
      return Promise.resolve(asset);
    }

    const p = new Promise<AssetProxy>(resolve => {
      if (isAbsolutePath(resolvedPath)) {
        // asset path is a public url so we can just use it as is
        asset = createAssetProxy({ path: resolvedPath, url: path });
        dispatch(addAsset(asset));
        resolve(asset);
      } else {
        if (error) {
          // on load error default back to original path
          asset = createAssetProxy({ path: resolvedPath, url: path });
          dispatch(addAsset(asset));
          resolve(asset);
        } else {
          loadAsset(resolvedPath, dispatch, getState).then(asset => {
            resolve(asset);
          });
        }
      }
    });

    promiseCache[resolvedPath] = p;

    return p;
  };
}

export type MediasAction = ReturnType<
  | typeof addAssets
  | typeof addAsset
  | typeof removeAsset
  | typeof loadAssetRequest
  | typeof loadAssetSuccess
  | typeof loadAssetFailure
>;
