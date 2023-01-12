import debounce from 'lodash/debounce';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { translate } from 'react-polyglot';
import { connect } from 'react-redux';

import { logoutUser as logoutUserAction } from '@staticcms/core/actions/auth';
import {
  createDraftDuplicateFromEntry as createDraftDuplicateFromEntryAction,
  createEmptyDraft as createEmptyDraftAction,
  deleteDraftLocalBackup as deleteDraftLocalBackupAction,
  deleteEntry as deleteEntryAction,
  deleteLocalBackup as deleteLocalBackupAction,
  discardDraft as discardDraftAction,
  loadEntries as loadEntriesAction,
  loadEntry as loadEntryAction,
  loadLocalBackup as loadLocalBackupAction,
  persistEntry as persistEntryAction,
  persistLocalBackup as persistLocalBackupAction,
  retrieveLocalBackup as retrieveLocalBackupAction,
} from '@staticcms/core/actions/entries';
import {
  loadScroll as loadScrollAction,
  toggleScroll as toggleScrollAction,
} from '@staticcms/core/actions/scroll';
import { selectFields } from '@staticcms/core/lib/util/collection.util';
import { useWindowEvent } from '@staticcms/core/lib/util/window.util';
import { selectEntry } from '@staticcms/core/reducers/selectors/entries';
import { history, navigateToCollection, navigateToNewEntry } from '@staticcms/core/routing/history';
import confirm from '../UI/Confirm';
import Loader from '../UI/Loader';
import EditorInterface from './EditorInterface';

import type {
  Collection,
  EditorPersistOptions,
  Entry,
  TranslatedProps,
} from '@staticcms/core/interface';
import type { RootState } from '@staticcms/core/store';
import type { Blocker } from 'history';
import type { ComponentType } from 'react';
import type { ConnectedProps } from 'react-redux';

const Editor = ({
  entry,
  entryDraft,
  fields,
  collection,
  user,
  hasChanged,
  displayUrl,
  isModification,
  logoutUser,
  draftKey,
  t,
  editorBackLink,
  toggleScroll,
  scrollSyncEnabled,
  loadScroll,
  showDelete,
  slug,
  localBackup,
  persistLocalBackup,
  loadEntry,
  persistEntry,
  deleteEntry,
  loadLocalBackup,
  retrieveLocalBackup,
  deleteLocalBackup,
  deleteDraftLocalBackup,
  createDraftDuplicateFromEntry,
  createEmptyDraft,
  discardDraft,
}: TranslatedProps<EditorProps>) => {
  const [version, setVersion] = useState(0);

  const createBackup = useMemo(
    () =>
      debounce(function (entry: Entry, collection: Collection) {
        persistLocalBackup(entry, collection);
      }, 2000),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const deleteBackup = useCallback(() => {
    createBackup.cancel();
    if (slug) {
      deleteLocalBackup(collection, slug);
    }
    deleteDraftLocalBackup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection, createBackup, slug]);

  const [submitted, setSubmitted] = useState(false);
  const handlePersistEntry = useCallback(
    async (opts: EditorPersistOptions = {}) => {
      const { createNew = false, duplicate = false } = opts;

      if (!entryDraft.entry) {
        return;
      }

      try {
        await persistEntry(collection);
        setVersion(version + 1);

        deleteBackup();

        if (createNew) {
          navigateToNewEntry(collection.name);
          if (duplicate && entryDraft.entry) {
            createDraftDuplicateFromEntry(entryDraft.entry);
          }
        }
        // eslint-disable-next-line no-empty
      } catch (e) {}

      setSubmitted(true);
    },
    [
      collection,
      createDraftDuplicateFromEntry,
      deleteBackup,
      entryDraft.entry,
      persistEntry,
      version,
    ],
  );

  const handleDuplicateEntry = useCallback(() => {
    if (!entryDraft.entry) {
      return;
    }

    navigateToNewEntry(collection.name);
    createDraftDuplicateFromEntry(entryDraft.entry);
  }, [collection.name, createDraftDuplicateFromEntry, entryDraft.entry]);

  const handleDeleteEntry = useCallback(async () => {
    if (entryDraft.hasChanged) {
      if (
        !(await confirm({
          title: 'editor.editor.onDeleteWithUnsavedChangesTitle',
          body: 'editor.editor.onDeleteWithUnsavedChangesBody',
          color: 'error',
        }))
      ) {
        return;
      }
    } else if (
      !(await confirm({
        title: 'editor.editor.onDeletePublishedEntryTitle',
        body: 'editor.editor.onDeletePublishedEntryBody',
        color: 'error',
      }))
    ) {
      return;
    }

    if (!slug) {
      return navigateToCollection(collection.name);
    }

    setTimeout(async () => {
      await deleteEntry(collection, slug);
      deleteBackup();
      return navigateToCollection(collection.name);
    }, 0);
  }, [collection, deleteBackup, deleteEntry, entryDraft.hasChanged, slug]);

  const [prevLocalBackup, setPrevLocalBackup] = useState<
    | {
        entry: Entry;
      }
    | undefined
  >();

  useEffect(() => {
    if (!prevLocalBackup && localBackup) {
      const updateLocalBackup = async () => {
        const confirmLoadBackupBody = await confirm({
          title: 'editor.editor.confirmLoadBackupTitle',
          body: 'editor.editor.confirmLoadBackupBody',
        });

        if (confirmLoadBackupBody) {
          loadLocalBackup();
          setVersion(version + 1);
        } else {
          deleteBackup();
        }
      };

      updateLocalBackup();
    }

    setPrevLocalBackup(localBackup);
  }, [deleteBackup, loadLocalBackup, localBackup, prevLocalBackup, version]);

  useEffect(() => {
    if (hasChanged && entryDraft.entry) {
      createBackup(entryDraft.entry, collection);
    }

    return () => {
      createBackup.flush();
    };
  }, [collection, createBackup, entryDraft.entry, hasChanged]);

  const [prevCollection, setPrevCollection] = useState<Collection | null>(null);
  const [preSlug, setPrevSlug] = useState<string | undefined | null>(null);
  useEffect(() => {
    if (!slug && preSlug !== slug) {
      setTimeout(() => {
        createEmptyDraft(collection, location.search);
      });
    } else if (slug && (prevCollection !== collection || preSlug !== slug)) {
      setTimeout(() => {
        retrieveLocalBackup(collection, slug);
        loadEntry(collection, slug);
      });
    }

    setPrevCollection(collection);
    setPrevSlug(slug);
  }, [
    collection,
    createEmptyDraft,
    discardDraft,
    entryDraft.entry,
    loadEntry,
    preSlug,
    prevCollection,
    retrieveLocalBackup,
    slug,
  ]);

  const leaveMessage = useMemo(() => t('editor.editor.onLeavePage'), [t]);

  const exitBlocker = useCallback(
    (event: BeforeUnloadEvent) => {
      if (entryDraft.hasChanged) {
        // This message is ignored in most browsers, but its presence triggers the confirmation dialog
        event.returnValue = leaveMessage;
        return leaveMessage;
      }
    },
    [entryDraft.hasChanged, leaveMessage],
  );

  useWindowEvent('beforeunload', exitBlocker);

  const navigationBlocker: Blocker = useCallback(
    ({ location, action }) => {
      /**
       * New entry being saved and redirected to it's new slug based url.
       */
      const isPersisting = entryDraft.entry?.isPersisting;
      const newRecord = entryDraft.entry?.newRecord;
      const newEntryPath = `/collections/${collection.name}/new`;
      if (isPersisting && newRecord && location.pathname === newEntryPath && action === 'PUSH') {
        return;
      }

      if (hasChanged) {
        return leaveMessage;
      }
    },
    [
      collection.name,
      entryDraft.entry?.isPersisting,
      entryDraft.entry?.newRecord,
      hasChanged,
      leaveMessage,
    ],
  );

  useEffect(() => {
    const unblock = history.block(navigationBlocker);

    return () => {
      unblock();
    };
  }, [collection.name, deleteBackup, discardDraft, navigationBlocker]);

  if (entry && entry.error) {
    return (
      <div>
        <h3>{entry.error}</h3>
      </div>
    );
  } else if (entryDraft == null || entryDraft.entry === undefined || (entry && entry.isFetching)) {
    return <Loader>{t('editor.editor.loadingEntry')}</Loader>;
  }

  return (
    <EditorInterface
      key={`editor-${version}`}
      draftKey={draftKey}
      entry={entryDraft.entry}
      collection={collection}
      fields={fields}
      fieldsErrors={entryDraft.fieldsErrors}
      onPersist={handlePersistEntry}
      onDelete={handleDeleteEntry}
      onDuplicate={handleDuplicateEntry}
      showDelete={showDelete ?? true}
      user={user}
      hasChanged={hasChanged}
      displayUrl={displayUrl}
      isNewEntry={!slug}
      isModification={isModification}
      onLogoutClick={logoutUser}
      editorBackLink={editorBackLink}
      toggleScroll={toggleScroll}
      scrollSyncEnabled={scrollSyncEnabled}
      loadScroll={loadScroll}
      submitted={submitted}
      t={t}
    />
  );
};

interface CollectionViewOwnProps {
  name: string;
  slug?: string;
  newRecord: boolean;
  showDelete?: boolean;
}

function mapStateToProps(state: RootState, ownProps: CollectionViewOwnProps) {
  const { collections, entryDraft, auth, config, entries, scroll } = state;
  const { name, slug } = ownProps;
  const collection = collections[name];
  const collectionName = collection.name;
  const fields = selectFields(collection, slug);
  const entry = !slug ? null : selectEntry(state, collectionName, slug);
  const user = auth.user;
  const hasChanged = entryDraft.hasChanged;
  const displayUrl = config.config?.display_url;
  const isModification = entryDraft.entry?.isModification ?? false;
  const collectionEntriesLoaded = Boolean(entries.pages[collectionName]);
  const localBackup = entryDraft.localBackup;
  const draftKey = entryDraft.key;
  let editorBackLink = `/collections/${collectionName}`;
  if ('files' in collection && collection.files?.length === 1) {
    editorBackLink = '/';
  }

  if ('nested' in collection && collection.nested && slug) {
    const pathParts = slug.split('/');
    if (pathParts.length > 2) {
      editorBackLink = `${editorBackLink}/filter/${pathParts.slice(0, -2).join('/')}`;
    }
  }

  const scrollSyncEnabled = scroll.isScrolling;

  return {
    ...ownProps,
    collection,
    collections,
    entryDraft,
    fields,
    entry,
    user,
    hasChanged,
    displayUrl,
    isModification,
    collectionEntriesLoaded,
    localBackup,
    draftKey,
    editorBackLink,
    scrollSyncEnabled,
  };
}

const mapDispatchToProps = {
  loadEntry: loadEntryAction,
  loadEntries: loadEntriesAction,
  loadLocalBackup: loadLocalBackupAction,
  deleteDraftLocalBackup: deleteDraftLocalBackupAction,
  retrieveLocalBackup: retrieveLocalBackupAction,
  persistLocalBackup: persistLocalBackupAction,
  deleteLocalBackup: deleteLocalBackupAction,
  createDraftDuplicateFromEntry: createDraftDuplicateFromEntryAction,
  createEmptyDraft: createEmptyDraftAction,
  discardDraft: discardDraftAction,
  persistEntry: persistEntryAction,
  deleteEntry: deleteEntryAction,
  logoutUser: logoutUserAction,
  toggleScroll: toggleScrollAction,
  loadScroll: loadScrollAction,
};

const connector = connect(mapStateToProps, mapDispatchToProps);
export type EditorProps = ConnectedProps<typeof connector>;

export default connector(translate()(Editor) as ComponentType<EditorProps>);
