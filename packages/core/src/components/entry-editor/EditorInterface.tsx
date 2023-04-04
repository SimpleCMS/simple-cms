import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ScrollSyncPane } from 'react-scroll-sync';

import { getI18nInfo, getPreviewEntry, hasI18n } from '@staticcms/core/lib/i18n';
import {
  getFileFromSlug,
  selectEntryCollectionTitle,
} from '@staticcms/core/lib/util/collection.util';
import MainView from '../MainView';
import EditorToolbar from './EditorToolbar';
import EditorControlPane from './editor-control-pane/EditorControlPane';
import EditorPreviewPane from './editor-preview-pane/EditorPreviewPane';

import type {
  Breadcrumb,
  Collection,
  EditorPersistOptions,
  Entry,
  Field,
  FieldsErrors,
  TranslatedProps,
} from '@staticcms/core/interface';

const PREVIEW_VISIBLE = 'cms.preview-visible';
const I18N_VISIBLE = 'cms.i18n-visible';

interface EditorContentProps {
  i18nActive: boolean;
  previewActive: boolean;
  editor: JSX.Element;
  editorSideBySideLocale: JSX.Element;
  editorWithPreview: JSX.Element;
}

const EditorContent = ({
  i18nActive,
  previewActive,
  editor,
  editorSideBySideLocale,
  editorWithPreview,
}: EditorContentProps) => {
  if (i18nActive) {
    return editorSideBySideLocale;
  } else if (previewActive) {
    return editorWithPreview;
  } else {
    return (
      <div className="flex justify-center">
        <div className="w-editor-only max-w-full h-main">{editor}</div>
      </div>
    );
  }
};

interface EditorInterfaceProps {
  draftKey: string;
  entry: Entry;
  collection: Collection;
  fields: Field[] | undefined;
  fieldsErrors: FieldsErrors;
  onPersist: (opts?: EditorPersistOptions) => void;
  onDelete: () => Promise<void>;
  onDuplicate: () => void;
  showDelete: boolean;
  hasChanged: boolean;
  displayUrl: string | undefined;
  isNewEntry: boolean;
  isModification: boolean;
  toggleScroll: () => Promise<void>;
  scrollSyncActive: boolean;
  loadScroll: () => void;
  submitted: boolean;
}

const EditorInterface = ({
  collection,
  entry,
  fields = [],
  fieldsErrors,
  showDelete,
  onDelete,
  onDuplicate,
  onPersist,
  hasChanged,
  displayUrl,
  isNewEntry,
  isModification,
  draftKey,
  scrollSyncActive,
  t,
  loadScroll,
  toggleScroll,
  submitted,
}: TranslatedProps<EditorInterfaceProps>) => {
  const { locales, defaultLocale } = useMemo(() => getI18nInfo(collection), [collection]) ?? {};
  const [selectedLocale, setSelectedLocale] = useState<string>(locales?.[1] ?? 'en');

  const [searchParams] = useSearchParams();
  const filterTerm = searchParams.get('path');

  const [previewActive, setPreviewActive] = useState(
    localStorage.getItem(PREVIEW_VISIBLE) !== 'false',
  );
  const [i18nActive, setI18nActive] = useState(
    Boolean(localStorage.getItem(I18N_VISIBLE) !== 'false' && locales && locales.length > 0),
  );

  useEffect(() => {
    loadScroll();
  }, [loadScroll]);

  const handleOnPersist = useCallback(
    async (opts: EditorPersistOptions = {}) => {
      const { createNew = false, duplicate = false } = opts;
      // await switchToDefaultLocale();
      onPersist({ createNew, duplicate });
    },
    [onPersist],
  );

  const handleTogglePreview = useCallback(() => {
    const newPreviewActive = !previewActive;
    setPreviewActive(newPreviewActive);
    localStorage.setItem(PREVIEW_VISIBLE, `${newPreviewActive}`);
  }, [previewActive]);

  const handleToggleScrollSync = useCallback(() => {
    toggleScroll();
  }, [toggleScroll]);

  const handleToggleI18n = useCallback(() => {
    const newI18nActive = !i18nActive;
    setI18nActive(newI18nActive);
    localStorage.setItem(I18N_VISIBLE, `${newI18nActive}`);
  }, [i18nActive]);

  const handleLocaleChange = useCallback((locale: string) => {
    setSelectedLocale(locale);
  }, []);

  const [showPreviewToggle, previewInFrame] = useMemo(() => {
    let preview = collection.editor?.preview ?? true;
    let frame = collection.editor?.frame ?? true;

    if ('files' in collection) {
      const file = getFileFromSlug(collection, entry.slug);
      if (file?.editor?.preview !== undefined) {
        preview = file.editor.preview;
      }

      if (file?.editor?.frame !== undefined) {
        frame = file.editor.frame;
      }
    }

    return [preview, frame];
  }, [collection, entry.slug]);

  const collectHasI18n = hasI18n(collection);

  const editor = (
    <div
      key={defaultLocale}
      id="control-pane"
      className="
        w-full
        overflow-y-auto
        styled-scrollbars
        h-main
      "
    >
      <EditorControlPane
        collection={collection}
        entry={entry}
        fields={fields}
        fieldsErrors={fieldsErrors}
        locale={defaultLocale}
        submitted={submitted}
        hideBorder={!previewActive && !i18nActive}
        t={t}
      />
    </div>
  );

  const editorLocale = useMemo(
    () => (
      <div
        key={selectedLocale}
        className="
          w-full
          overflow-y-auto
          styled-scrollbars
          h-main
        "
      >
        <EditorControlPane
          collection={collection}
          entry={entry}
          fields={fields}
          fieldsErrors={fieldsErrors}
          locale={selectedLocale}
          onLocaleChange={handleLocaleChange}
          submitted={submitted}
          canChangeLocale
          hideBorder
          t={t}
        />
      </div>
    ),
    [collection, entry, fields, fieldsErrors, handleLocaleChange, selectedLocale, submitted, t],
  );

  const previewEntry = collectHasI18n
    ? getPreviewEntry(entry, selectedLocale[0], defaultLocale)
    : entry;

  const editorWithPreview = (
    <div className="grid grid-cols-editor h-full">
      <ScrollSyncPane>{editor}</ScrollSyncPane>
      <EditorPreviewPane
        collection={collection}
        previewInFrame={previewInFrame}
        entry={previewEntry}
        fields={fields}
      />
    </div>
  );

  const editorSideBySideLocale = (
    <div className="grid grid-cols-2 h-full">
      <ScrollSyncPane>{editor}</ScrollSyncPane>
      <ScrollSyncPane>
        <>{editorLocale}</>
      </ScrollSyncPane>
    </div>
  );

  const summary = useMemo(() => selectEntryCollectionTitle(collection, entry), [collection, entry]);

  const breadcrumbs = useMemo(() => {
    const crumbs: Breadcrumb[] = [
      {
        name: collection.label,
        to: `/collections/${collection.name}`,
      },
    ];

    if (filterTerm) {
      crumbs.push({
        name: filterTerm,
        to: `/collections/${collection.name}/filter/${filterTerm}`,
      });
    }

    crumbs.push({
      name: isNewEntry
        ? t('collection.collectionTop.newButton', {
            collectionLabel: collection.label_singular || collection.label,
          })
        : summary,
    });

    return crumbs;
  }, [
    collection.label,
    collection.label_singular,
    collection.name,
    filterTerm,
    isNewEntry,
    summary,
    t,
  ]);

  return (
    <MainView
      breadcrumbs={breadcrumbs}
      noMargin
      noScroll
      navbarActions={
        <EditorToolbar
          isPersisting={entry.isPersisting}
          isDeleting={entry.isDeleting}
          onPersist={handleOnPersist}
          onPersistAndNew={() => handleOnPersist({ createNew: true })}
          onPersistAndDuplicate={() => handleOnPersist({ createNew: true, duplicate: true })}
          onDelete={onDelete}
          showDelete={showDelete}
          onDuplicate={onDuplicate}
          hasChanged={hasChanged}
          displayUrl={displayUrl}
          collection={collection}
          isNewEntry={isNewEntry}
          isModification={isModification}
          showPreviewToggle={showPreviewToggle}
          previewActive={previewActive}
          scrollSyncActive={scrollSyncActive}
          showI18nToggle={collectHasI18n}
          i18nActive={i18nActive}
          togglePreview={handleTogglePreview}
          toggleScrollSync={handleToggleScrollSync}
          toggleI18n={handleToggleI18n}
        />
      }
    >
      <EditorContent
        key={draftKey}
        i18nActive={i18nActive}
        previewActive={previewActive && !i18nActive}
        editor={editor}
        editorSideBySideLocale={editorSideBySideLocale}
        editorWithPreview={editorWithPreview}
      />
    </MainView>
  );
};

export default EditorInterface;
