import { currentBackend } from '../backend';
import confirm from '../components/UI/Confirm';
import {
  MEDIA_DELETE_FAILURE,
  MEDIA_DELETE_REQUEST,
  MEDIA_DELETE_SUCCESS,
  MEDIA_DISPLAY_URL_FAILURE,
  MEDIA_DISPLAY_URL_REQUEST,
  MEDIA_DISPLAY_URL_SUCCESS,
  MEDIA_INSERT,
  MEDIA_LIBRARY_CLOSE,
  MEDIA_LIBRARY_CREATE,
  MEDIA_LIBRARY_OPEN,
  MEDIA_LOAD_FAILURE,
  MEDIA_LOAD_REQUEST,
  MEDIA_LOAD_SUCCESS,
  MEDIA_PERSIST_FAILURE,
  MEDIA_PERSIST_REQUEST,
  MEDIA_PERSIST_SUCCESS,
  MEDIA_REMOVE_INSERTED,
} from '../constants';
import { sanitizeSlug } from '../lib/urlHelper';
import { basename, getBlobSHA } from '../lib/util';
import { selectMediaFilePath, selectMediaFilePublicPath } from '../lib/util/media.util';
import { selectEditingDraft } from '../reducers/selectors/entryDraft';
import { selectMediaDisplayURL, selectMediaFiles } from '../reducers/selectors/mediaLibrary';
import { addSnackbar } from '../store/slices/snackbars';
import { createAssetProxy } from '../valueObjects/AssetProxy';
import { addDraftEntryMediaFile, removeDraftEntryMediaFile } from './entries';
import { addAsset, removeAsset } from './media';
import { waitUntilWithTimeout } from './waitUntil';

import type { AnyAction } from 'redux';
import type { ThunkDispatch } from 'redux-thunk';
import type {
  BaseField,
  DisplayURLState,
  Field,
  ImplementationMediaFile,
  MediaFile,
  MediaLibraryInstance,
  UnknownField,
} from '../interface';
import type { RootState } from '../store';
import type AssetProxy from '../valueObjects/AssetProxy';

export function createMediaLibrary(instance: MediaLibraryInstance) {
  const api = {
    show: instance.show || (() => undefined),
    hide: instance.hide || (() => undefined),
    onClearControl: instance.onClearControl || (() => undefined),
    onRemoveControl: instance.onRemoveControl || (() => undefined),
    enableStandalone: instance.enableStandalone || (() => undefined),
  };
  return { type: MEDIA_LIBRARY_CREATE, payload: api } as const;
}

export function clearMediaControl(id: string) {
  return (_dispatch: ThunkDispatch<RootState, {}, AnyAction>, getState: () => RootState) => {
    const state = getState();
    const mediaLibrary = state.mediaLibrary.externalLibrary;
    if (mediaLibrary) {
      mediaLibrary.onClearControl?.({ id });
    }
  };
}

export function removeMediaControl(id: string) {
  return (_dispatch: ThunkDispatch<RootState, {}, AnyAction>, getState: () => RootState) => {
    const state = getState();
    const mediaLibrary = state.mediaLibrary.externalLibrary;
    if (mediaLibrary) {
      mediaLibrary.onRemoveControl?.({ id });
    }
  };
}

export function openMediaLibrary<F extends BaseField = UnknownField>(
  payload: {
    controlID?: string;
    forImage?: boolean;
    value?: string | string[];
    allowMultiple?: boolean;
    replaceIndex?: number;
    config?: Record<string, unknown>;
    field?: F;
  } = {},
) {
  return (dispatch: ThunkDispatch<RootState, {}, AnyAction>, getState: () => RootState) => {
    const state = getState();
    const mediaLibrary = state.mediaLibrary.externalLibrary;
    const { controlID, value, config = {}, allowMultiple, forImage, replaceIndex, field } = payload;
    if (mediaLibrary) {
      mediaLibrary.show({ id: controlID, value, config, allowMultiple, imagesOnly: forImage });
    }
    dispatch(
      mediaLibraryOpened({
        controlID,
        forImage,
        value,
        allowMultiple,
        replaceIndex,
        config,
        field: field as Field,
      }),
    );
  };
}

export function closeMediaLibrary() {
  return (dispatch: ThunkDispatch<RootState, {}, AnyAction>, getState: () => RootState) => {
    const state = getState();
    const mediaLibrary = state.mediaLibrary.externalLibrary;
    if (mediaLibrary) {
      mediaLibrary.hide?.();
    }
    dispatch(mediaLibraryClosed());
  };
}

export function insertMedia(mediaPath: string | string[], field: Field | undefined) {
  return (dispatch: ThunkDispatch<RootState, {}, AnyAction>, getState: () => RootState) => {
    const state = getState();
    const config = state.config.config;
    const entry = state.entryDraft.entry;
    const collectionName = state.entryDraft.entry?.collection;
    if (!collectionName || !config) {
      return;
    }

    const collection = state.collections[collectionName];
    if (Array.isArray(mediaPath)) {
      mediaPath = mediaPath.map(path =>
        selectMediaFilePublicPath(config, collection, path, entry, field),
      );
    } else {
      mediaPath = selectMediaFilePublicPath(config, collection, mediaPath as string, entry, field);
    }
    dispatch(mediaInserted(mediaPath));
  };
}

export function removeInsertedMedia(controlID: string) {
  return { type: MEDIA_REMOVE_INSERTED, payload: { controlID } } as const;
}

export function loadMedia(opts: { delay?: number; query?: string; page?: number } = {}) {
  const { delay = 0, page = 1 } = opts;
  return async (dispatch: ThunkDispatch<RootState, {}, AnyAction>, getState: () => RootState) => {
    const state = getState();
    const config = state.config.config;
    if (!config) {
      return;
    }

    const backend = currentBackend(config);
    dispatch(mediaLoading(page));

    function loadFunction() {
      return backend
        .getMedia()
        .then(files => dispatch(mediaLoaded(files)))
        .catch((error: { status?: number }) => {
          console.error(error);
          if (error.status === 404) {
            console.info('This 404 was expected and handled appropriately.');
            dispatch(mediaLoaded([]));
          } else {
            dispatch(mediaLoadFailed());
          }
        });
    }

    if (delay > 0) {
      return new Promise(resolve => {
        setTimeout(() => resolve(loadFunction()), delay);
      });
    } else {
      return loadFunction();
    }
  };
}

function createMediaFileFromAsset({
  id,
  file,
  assetProxy,
  draft,
}: {
  id: string;
  file: File;
  assetProxy: AssetProxy;
  draft: boolean;
}): ImplementationMediaFile {
  const mediaFile = {
    id,
    name: basename(assetProxy.path),
    displayURL: assetProxy.url,
    draft,
    file,
    size: file.size,
    url: assetProxy.url,
    path: assetProxy.path,
    field: assetProxy.field,
  };
  return mediaFile;
}

export function persistMedia(file: File, opts: MediaOptions = {}) {
  const { field } = opts;
  return async (dispatch: ThunkDispatch<RootState, {}, AnyAction>, getState: () => RootState) => {
    const state = getState();
    const config = state.config.config;
    if (!config) {
      return;
    }

    const backend = currentBackend(config);
    const files: MediaFile[] = selectMediaFiles(state, field);
    const fileName = sanitizeSlug(file.name.toLowerCase(), config.slug);
    const existingFile = files.find(existingFile => existingFile.name.toLowerCase() === fileName);

    const editingDraft = selectEditingDraft(state);

    /**
     * Check for existing files of the same name before persisting. If no asset
     * store integration is used, files are being stored in Git, so we can
     * expect file names to be unique. If an asset store is in use, file names
     * may not be unique, so we forego this check.
     */
    if (existingFile) {
      if (
        !(await confirm({
          title: 'mediaLibrary.mediaLibrary.alreadyExistsTitle',
          body: {
            key: 'mediaLibrary.mediaLibrary.alreadyExistsBody',
            options: { filename: existingFile.name },
          },
          color: 'error',
        }))
      ) {
        return;
      } else {
        await dispatch(deleteMedia(existingFile));
      }
    }

    if (!editingDraft) {
      dispatch(mediaPersisting());
    }

    try {
      const entry = state.entryDraft.entry;
      const collection = entry?.collection ? state.collections[entry.collection] : null;
      const path = selectMediaFilePath(config, collection, entry, fileName, field);
      const assetProxy = createAssetProxy({
        file,
        path,
        field,
      });

      dispatch(addAsset(assetProxy));

      let mediaFile: ImplementationMediaFile;
      if (editingDraft) {
        const id = await getBlobSHA(file);
        mediaFile = createMediaFileFromAsset({
          id,
          file,
          assetProxy,
          draft: Boolean(editingDraft),
        });
        return dispatch(addDraftEntryMediaFile(mediaFile));
      } else {
        mediaFile = await backend.persistMedia(config, assetProxy);
      }

      return dispatch(mediaPersisted(mediaFile));
    } catch (error) {
      console.error(error);
      dispatch(
        addSnackbar({
          type: 'error',
          message: {
            key: 'ui.toast.onFailToPersistMedia',
            options: {
              details: error,
            },
          },
        }),
      );
      return dispatch(mediaPersistFailed());
    }
  };
}

export function deleteMedia(file: MediaFile) {
  return async (dispatch: ThunkDispatch<RootState, {}, AnyAction>, getState: () => RootState) => {
    const state = getState();
    const config = state.config.config;
    if (!config) {
      return;
    }

    const backend = currentBackend(config);

    try {
      if (file.draft) {
        dispatch(removeAsset(file.path));
        dispatch(removeDraftEntryMediaFile({ id: file.id }));
      } else {
        const editingDraft = selectEditingDraft(state);

        dispatch(mediaDeleting());
        dispatch(removeAsset(file.path));

        await backend.deleteMedia(config, file.path);

        dispatch(mediaDeleted(file));
        if (editingDraft) {
          dispatch(removeDraftEntryMediaFile({ id: file.id }));
        }
      }
    } catch (error: unknown) {
      console.error(error);

      if (error instanceof Error) {
        dispatch(
          addSnackbar({
            type: 'error',
            message: {
              key: 'ui.toast.onFailToDeleteMedia',
              options: {
                details: error.message,
              },
            },
          }),
        );
      }

      return dispatch(mediaDeleteFailed());
    }
  };
}

export async function getMediaFile(state: RootState, path: string) {
  const config = state.config.config;
  if (!config) {
    return { url: '' };
  }

  const backend = currentBackend(config);
  const { url } = await backend.getMediaFile(path);
  return { url };
}

export function loadMediaDisplayURL(file: MediaFile) {
  return async (dispatch: ThunkDispatch<RootState, {}, AnyAction>, getState: () => RootState) => {
    const { displayURL, id } = file;
    const state = getState();
    const config = state.config.config;
    if (!config) {
      return Promise.reject();
    }

    const displayURLState: DisplayURLState = selectMediaDisplayURL(state, id);
    if (
      !id ||
      !displayURL ||
      displayURLState.url ||
      displayURLState.isFetching ||
      displayURLState.err
    ) {
      return Promise.resolve();
    }

    if (typeof displayURL === 'string') {
      dispatch(mediaDisplayURLRequest(id));
      dispatch(mediaDisplayURLSuccess(id, displayURL));
      return;
    }

    try {
      const backend = currentBackend(config);
      dispatch(mediaDisplayURLRequest(id));
      const newURL = await backend.getMediaDisplayURL(displayURL);
      if (newURL) {
        dispatch(mediaDisplayURLSuccess(id, newURL));
      } else {
        throw new Error('No display URL was returned!');
      }
    } catch (error: unknown) {
      console.error(error);

      if (error instanceof Error) {
        dispatch(mediaDisplayURLFailure(id, error));
      }
    }
  };
}

function mediaLibraryOpened(payload: {
  controlID?: string;
  forImage?: boolean;
  value?: string | string[];
  replaceIndex?: number;
  allowMultiple?: boolean;
  config?: Record<string, unknown>;
  field?: Field;
}) {
  return { type: MEDIA_LIBRARY_OPEN, payload } as const;
}

function mediaLibraryClosed() {
  return { type: MEDIA_LIBRARY_CLOSE } as const;
}

function mediaInserted(mediaPath: string | string[]) {
  return { type: MEDIA_INSERT, payload: { mediaPath } } as const;
}

export function mediaLoading(page: number) {
  return {
    type: MEDIA_LOAD_REQUEST,
    payload: { page },
  } as const;
}

export interface MediaOptions {
  field?: Field;
  page?: number;
  canPaginate?: boolean;
  dynamicSearch?: boolean;
  dynamicSearchQuery?: string;
}

export function mediaLoaded(files: ImplementationMediaFile[], opts: MediaOptions = {}) {
  return {
    type: MEDIA_LOAD_SUCCESS,
    payload: { files, ...opts },
  } as const;
}

export function mediaLoadFailed() {
  return { type: MEDIA_LOAD_FAILURE } as const;
}

export function mediaPersisting() {
  return { type: MEDIA_PERSIST_REQUEST } as const;
}

export function mediaPersisted(file: ImplementationMediaFile) {
  return {
    type: MEDIA_PERSIST_SUCCESS,
    payload: { file },
  } as const;
}

export function mediaPersistFailed() {
  return { type: MEDIA_PERSIST_FAILURE } as const;
}

export function mediaDeleting() {
  return { type: MEDIA_DELETE_REQUEST } as const;
}

export function mediaDeleted(file: MediaFile) {
  return {
    type: MEDIA_DELETE_SUCCESS,
    payload: { file },
  } as const;
}

export function mediaDeleteFailed() {
  return { type: MEDIA_DELETE_FAILURE } as const;
}

export function mediaDisplayURLRequest(key: string) {
  return { type: MEDIA_DISPLAY_URL_REQUEST, payload: { key } } as const;
}

export function mediaDisplayURLSuccess(key: string, url: string) {
  return {
    type: MEDIA_DISPLAY_URL_SUCCESS,
    payload: { key, url },
  } as const;
}

export function mediaDisplayURLFailure(key: string, err: Error) {
  return {
    type: MEDIA_DISPLAY_URL_FAILURE,
    payload: { key, err },
  } as const;
}

export async function waitForMediaLibraryToLoad(
  dispatch: ThunkDispatch<RootState, {}, AnyAction>,
  state: RootState,
) {
  if (state.mediaLibrary.isLoading !== false && !state.mediaLibrary.externalLibrary) {
    await waitUntilWithTimeout(dispatch, resolve => ({
      predicate: ({ type }) => type === MEDIA_LOAD_SUCCESS || type === MEDIA_LOAD_FAILURE,
      run: () => resolve(),
    }));
  }
}

export async function getMediaDisplayURL(
  dispatch: ThunkDispatch<RootState, {}, AnyAction>,
  state: RootState,
  file: MediaFile,
) {
  const displayURLState: DisplayURLState = selectMediaDisplayURL(state, file.id);

  let url: string | null | undefined;
  if (displayURLState.url) {
    // url was already loaded
    url = displayURLState.url;
  } else if (displayURLState.err) {
    // url loading had an error
    url = null;
  } else {
    const key = file.id;
    const promise = waitUntilWithTimeout<string>(dispatch, resolve => ({
      predicate: ({ type, payload }) =>
        (type === MEDIA_DISPLAY_URL_SUCCESS || type === MEDIA_DISPLAY_URL_FAILURE) &&
        payload.key === key,
      run: (_dispatch, _getState, action) => resolve(action.payload.url),
    }));

    if (!displayURLState.isFetching) {
      // load display url
      dispatch(loadMediaDisplayURL(file));
    }

    url = await promise;
  }

  return url;
}

export type MediaLibraryAction = ReturnType<
  | typeof createMediaLibrary
  | typeof mediaLibraryOpened
  | typeof mediaLibraryClosed
  | typeof mediaInserted
  | typeof removeInsertedMedia
  | typeof mediaLoading
  | typeof mediaLoaded
  | typeof mediaLoadFailed
  | typeof mediaPersisting
  | typeof mediaPersisted
  | typeof mediaPersistFailed
  | typeof mediaDeleting
  | typeof mediaDeleted
  | typeof mediaDeleteFailed
  | typeof mediaDisplayURLRequest
  | typeof mediaDisplayURLSuccess
  | typeof mediaDisplayURLFailure
>;
