import styled from '@emotion/styled';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { translate } from 'react-polyglot';
import { connect } from 'react-redux';

import { changeViewStyle, filterByField, groupByField, sortByField } from '../../actions/entries';
import { SortDirection } from '../../interface';
import { getNewEntryUrl } from '../../lib/urlHelper';
import {
  selectSortableFields,
  selectViewFilters,
  selectViewGroups,
} from '../../reducers/collections';
import {
  selectEntriesFilter,
  selectEntriesGroup,
  selectEntriesSort,
  selectViewStyle,
} from '../../reducers/entries';
import { components, lengths } from '../../ui';
import CollectionControls from './CollectionControls';
import CollectionTop from './CollectionTop';
import EntriesCollection from './Entries/EntriesCollection';
import EntriesSearch from './Entries/EntriesSearch';
import Sidebar from './Sidebar';

import type { ComponentType } from 'react';
import type { ConnectedProps } from 'react-redux';
import type { Collection, State, TranslatedProps, ViewFilter, ViewGroup } from '../../interface';

const CollectionContainer = styled.div`
  margin: ${lengths.pageMargin};
`;

const CollectionMain = styled.main`
  padding-left: 280px;
`;

const SearchResultContainer = styled.div`
  ${components.cardTop};
  margin-bottom: 22px;
`;

const SearchResultHeading = styled.h1`
  ${components.cardTopHeading};
`;

const CollectionView = ({
  collection,
  collections,
  collectionName,
  isSearchEnabled,
  isSearchResults,
  isSingleSearchResult,
  searchTerm,
  sortableFields,
  onSortClick,
  sort,
  viewFilters,
  viewGroups,
  filterTerm,
  t,
  onFilterClick,
  onGroupClick,
  filter,
  group,
  onChangeViewStyle,
  viewStyle,
}: CollectionViewProps) => {
  const [readyToLoad, setReadyToLoad] = useState(false);

  const newEntryUrl = useMemo(() => {
    let url = collection.create ? getNewEntryUrl(collectionName) : '';
    if (url && filterTerm) {
      url = getNewEntryUrl(collectionName);
      if (filterTerm) {
        url = `${newEntryUrl}?path=${filterTerm}`;
      }
    }
    return url;
  }, [collection, collectionName, filterTerm]);

  const searchResultKey = useMemo(
    () => `collection.collectionTop.searchResults${isSingleSearchResult ? 'InCollection' : ''}`,
    [isSingleSearchResult],
  );

  const renderEntriesCollection = useCallback(() => {
    return (
      <EntriesCollection
        collection={collection}
        viewStyle={viewStyle}
        filterTerm={filterTerm}
        readyToLoad={readyToLoad}
      />
    );
  }, [collection, filterTerm, viewStyle, readyToLoad]);

  const renderEntriesSearch = useCallback(() => {
    let searchCollections = collections;
    if (isSingleSearchResult) {
      const searchCollection = Object.values(collections).filter(c => c === collection);
      if (searchCollection.length === 1) {
        searchCollections = {
          [searchCollection[0].name]: searchCollection[0],
        };
      }
    }

    return <EntriesSearch collections={searchCollections} searchTerm={searchTerm} />;
  }, [searchTerm, collections, collection, isSingleSearchResult]);

  useEffect(() => {
    const sorts = Object.keys(sort ?? {});
    if (sorts.length > 0) {
      setReadyToLoad(true);
      return;
    }

    const defaultSort = collection.sortable_fields.default;

    if (!defaultSort || !defaultSort.field) {
      setReadyToLoad(true);
      return;
    }

    let alive = true;
    const sortEntries = async () => {
      await onSortClick(defaultSort.field, defaultSort.direction ?? SortDirection.Ascending);
      if (alive) {
        setReadyToLoad(true);
      }
    };

    sortEntries();

    return () => {
      alive = false;
    };
  }, [collection, onSortClick, sort]);

  return (
    <CollectionContainer>
      <Sidebar
        collections={collections}
        collection={(!isSearchResults || isSingleSearchResult) && collection}
        isSearchEnabled={isSearchEnabled}
        searchTerm={searchTerm}
        filterTerm={filterTerm}
      />
      <CollectionMain>
        {isSearchResults ? (
          <SearchResultContainer>
            <SearchResultHeading>
              {t(searchResultKey, { searchTerm, collection: collection.label })}
            </SearchResultHeading>
          </SearchResultContainer>
        ) : (
          <>
            <CollectionTop collection={collection} newEntryUrl={newEntryUrl} />
            <CollectionControls
              viewStyle={viewStyle}
              onChangeViewStyle={onChangeViewStyle}
              sortableFields={sortableFields}
              onSortClick={onSortClick}
              sort={sort}
              viewFilters={viewFilters}
              viewGroups={viewGroups}
              t={t}
              onFilterClick={onFilterClick}
              onGroupClick={onGroupClick}
              filter={filter}
              group={group}
            />
          </>
        )}
        {isSearchResults ? renderEntriesSearch() : renderEntriesCollection()}
      </CollectionMain>
    </CollectionContainer>
  );
};

interface CollectionViewOwnProps {
  isSearchResults?: boolean;
  isSingleSearchResult?: boolean;
  name: string;
  searchTerm?: string;
  filterTerm?: string;
}

function mapStateToProps(state: State, ownProps: TranslatedProps<CollectionViewOwnProps>) {
  const { collections } = state;
  const isSearchEnabled = state.config.config && state.config.config.search != false;
  const { isSearchResults, name, searchTerm = '', filterTerm = '', t } = ownProps;
  const collection: Collection = name ? collections[name] : collections[0];
  const sort = selectEntriesSort(state.entries, collection.name);
  const sortableFields = selectSortableFields(collection, t);
  const viewFilters = selectViewFilters(collection);
  const viewGroups = selectViewGroups(collection);
  const filter = selectEntriesFilter(state.entries, collection.name);
  const group = selectEntriesGroup(state.entries, collection.name);
  const viewStyle = selectViewStyle(state.entries);

  return {
    collection,
    collections,
    collectionName: name,
    isSearchEnabled,
    isSearchResults,
    searchTerm,
    filterTerm,
    sort,
    sortableFields,
    viewFilters,
    viewGroups,
    filter,
    group,
    viewStyle,
  };
}

const mapDispatchToProps = {
  sortByField,
  filterByField,
  changeViewStyle,
  groupByField,
};

function mergeProps(
  stateProps: ReturnType<typeof mapStateToProps>,
  dispatchProps: typeof mapDispatchToProps,
  ownProps: TranslatedProps<CollectionViewOwnProps>,
) {
  return {
    ...stateProps,
    ...ownProps,
    onSortClick: (key: string, direction: SortDirection) =>
      dispatchProps.sortByField(stateProps.collection, key, direction),
    onFilterClick: (filter: ViewFilter) =>
      dispatchProps.filterByField(stateProps.collection, filter),
    onGroupClick: (group: ViewGroup) => dispatchProps.groupByField(stateProps.collection, group),
    onChangeViewStyle: (viewStyle: string) => dispatchProps.changeViewStyle(viewStyle),
  };
}

const connector = connect(mapStateToProps, mapDispatchToProps, mergeProps);
export type CollectionViewProps = ConnectedProps<typeof connector> & CollectionViewOwnProps;

export default connector(translate()(CollectionView) as ComponentType<CollectionViewProps>);
