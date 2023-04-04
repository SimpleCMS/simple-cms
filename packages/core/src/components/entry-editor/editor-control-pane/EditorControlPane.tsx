import React, { useMemo } from 'react';

import { getI18nInfo, hasI18n, isFieldTranslatable } from '@staticcms/core/lib/i18n';
import classNames from '@staticcms/core/lib/util/classNames.util';
import { getFieldValue } from '@staticcms/core/lib/util/field.util';
import EditorControl from './EditorControl';
import LocaleDropdown from './LocaleDropdown';

import type {
  Collection,
  Entry,
  Field,
  FieldsErrors,
  I18nSettings,
  TranslatedProps,
} from '@staticcms/core/interface';

export interface EditorControlPaneProps {
  collection: Collection;
  entry: Entry;
  fields: Field[];
  fieldsErrors: FieldsErrors;
  submitted: boolean;
  locale?: string;
  canChangeLocale?: boolean;
  hideBorder: boolean;
  onLocaleChange?: (locale: string) => void;
}

const EditorControlPane = ({
  collection,
  entry,
  fields,
  fieldsErrors,
  submitted,
  locale,
  canChangeLocale = false,
  hideBorder,
  onLocaleChange,
  t,
}: TranslatedProps<EditorControlPaneProps>) => {
  const i18n = useMemo(() => {
    if (hasI18n(collection)) {
      const { locales, defaultLocale } = getI18nInfo(collection);
      return {
        currentLocale: locale ?? locales[0],
        locales,
        defaultLocale,
      } as I18nSettings;
    }

    return undefined;
  }, [collection, locale]);

  if (!collection || !fields) {
    return null;
  }

  if (!entry || entry.partial === true) {
    return null;
  }

  return (
    <div
      className={classNames(
        `
          flex
          flex-col
          min-h-full
        `,
        !hideBorder &&
          `
          border-r
          border-slate-400
        `,
      )}
    >
      {i18n?.locales && locale ? (
        <div
          className="
            p-3
          "
        >
          <LocaleDropdown
            locales={i18n.locales}
            defaultLocale={i18n.defaultLocale}
            dropdownText={t('editor.editorControlPane.i18n.writingInLocale', {
              locale: locale?.toUpperCase(),
            })}
            canChangeLocale={canChangeLocale}
            onLocaleChange={onLocaleChange}
          />
        </div>
      ) : null}
      {fields.map(field => {
        const isTranslatable = isFieldTranslatable(field, locale, i18n?.defaultLocale);
        const key = i18n ? `field-${locale}_${field.name}` : `field-${field.name}`;

        return (
          <EditorControl
            key={key}
            field={field}
            value={getFieldValue(field, entry, isTranslatable, locale)}
            fieldsErrors={fieldsErrors}
            submitted={submitted}
            locale={locale}
            parentPath=""
            i18n={i18n}
          />
        );
      })}
    </div>
  );
};

export default EditorControlPane;
