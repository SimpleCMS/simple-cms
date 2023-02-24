import React, { useCallback, useMemo } from 'react';
import { Waypoint } from 'react-waypoint';

import { selectFields, selectInferredField } from '@staticcms/core/lib/util/collection.util';
import Table from '../../common/table/Table';
import EntryCard from './EntryCard';

import type { ViewStyle } from '@staticcms/core/constants/views';
import type { Collection, Collections, Entry, Field } from '@staticcms/core/interface';
import type Cursor from '@staticcms/core/lib/util/Cursor';

export interface BaseEntryListingProps {
  entries: Entry[];
  viewStyle: ViewStyle;
  cursor?: Cursor;
  handleCursorActions?: (action: string) => void;
  page?: number;
}

export interface SingleCollectionEntryListingProps extends BaseEntryListingProps {
  collection: Collection;
}

export interface MultipleCollectionEntryListingProps extends BaseEntryListingProps {
  collections: Collections;
}

export type EntryListingProps =
  | SingleCollectionEntryListingProps
  | MultipleCollectionEntryListingProps;

const EntryListing = ({
  entries,
  page,
  cursor,
  viewStyle,
  handleCursorActions,
  ...otherProps
}: EntryListingProps) => {
  const hasMore = useMemo(() => cursor?.actions?.has('append_next'), [cursor?.actions]);

  const handleLoadMore = useCallback(() => {
    if (hasMore) {
      handleCursorActions?.('append_next');
    }
  }, [handleCursorActions, hasMore]);

  const inferFields = useCallback(
    (
      collection?: Collection,
    ): {
      titleField?: string | null;
      descriptionField?: string | null;
      imageField?: string | null;
      remainingFields?: Field[];
    } => {
      if (!collection) {
        return {};
      }

      const titleField = selectInferredField(collection, 'title');
      const descriptionField = selectInferredField(collection, 'description');
      const imageField = selectInferredField(collection, 'image');
      const fields = selectFields(collection);
      const inferredFields = [titleField, descriptionField, imageField];
      const remainingFields = fields && fields.filter(f => inferredFields.indexOf(f.name) === -1);
      return { titleField, descriptionField, imageField, remainingFields };
    },
    [],
  );

  const summaryFields = useMemo(() => {
    let fields: string[] | undefined;
    if ('collection' in otherProps) {
      fields = otherProps.collection.summary_fields;
    }

    return fields ?? ['summary'];
  }, [otherProps]);

  const renderedCards = useMemo(() => {
    if ('collection' in otherProps) {
      const inferredFields = inferFields(otherProps.collection);
      return entries.map(entry => (
        <EntryCard
          collection={otherProps.collection}
          imageFieldName={inferredFields.imageField}
          viewStyle={viewStyle}
          entry={entry}
          key={entry.slug}
          summaryFields={summaryFields}
        />
      ));
    }

    const isSingleCollectionInList = Object.keys(otherProps.collections).length === 1;
    return entries.map(entry => {
      const collectionName = entry.collection;
      const collection = Object.values(otherProps.collections).find(
        coll => coll.name === collectionName,
      );

      const collectionLabel = !isSingleCollectionInList ? collection?.label : undefined;
      const inferredFields = inferFields(collection);
      return collection ? (
        <EntryCard
          collection={collection}
          entry={entry}
          imageFieldName={inferredFields.imageField}
          collectionLabel={collectionLabel}
          key={entry.slug}
          summaryFields={summaryFields}
        />
      ) : null;
    });
  }, [entries, inferFields, otherProps, summaryFields, viewStyle]);

  if (viewStyle === 'VIEW_STYLE_LIST') {
    return (
      <Table columns={summaryFields}>
        {renderedCards}
        {hasMore && handleLoadMore && <Waypoint key={page} onEnter={handleLoadMore} />}
      </Table>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {renderedCards}
      {hasMore && handleLoadMore && <Waypoint key={page} onEnter={handleLoadMore} />}
    </div>
  );
};

export default EntryListing;
