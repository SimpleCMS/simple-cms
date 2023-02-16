import React from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Waypoint } from 'react-waypoint';
import { FixedSizeGrid as Grid } from 'react-window';

import MediaLibraryCard from './MediaLibraryCard';

import type { Collection, Field, MediaFile } from '@staticcms/core/interface';
import type {
  MediaLibraryDisplayURL,
  MediaLibraryState,
} from '@staticcms/core/reducers/mediaLibrary';
import type { GridChildComponentProps } from 'react-window';

export interface MediaLibraryCardItem {
  displayURL?: MediaLibraryDisplayURL;
  id: string;
  key: string;
  name: string;
  type: string;
  draft: boolean;
  isViewableImage?: boolean;
  url?: string;
}

export interface MediaLibraryCardGridProps {
  scrollContainerRef: React.MutableRefObject<HTMLDivElement | null>;
  mediaItems: MediaFile[];
  isSelectedFile: (file: MediaFile) => boolean;
  onAssetClick: (asset: MediaFile) => void;
  canLoadMore?: boolean;
  onLoadMore: () => void;
  isPaginating?: boolean;
  paginatingMessage?: string;
  cardDraftText: string;
  cardWidth: string;
  cardHeight: string;
  cardMargin: string;
  loadDisplayURL: (asset: MediaFile) => void;
  displayURLs: MediaLibraryState['displayURLs'];
  collection?: Collection;
  field?: Field;
}

export type CardGridItemData = MediaLibraryCardGridProps & {
  columnCount: number;
  gutter: number;
};

const CardWrapper = ({
  rowIndex,
  columnIndex,
  style,
  data: {
    mediaItems,
    isSelectedFile,
    onAssetClick,
    cardDraftText,
    cardWidth,
    cardHeight,
    displayURLs,
    loadDisplayURL,
    columnCount,
    gutter,
    collection,
    field,
  },
}: GridChildComponentProps<CardGridItemData>) => {
  const index = rowIndex * columnCount + columnIndex;
  if (index >= mediaItems.length) {
    return null;
  }
  const file = mediaItems[index];

  return (
    <div
      style={{
        ...style,
        left: typeof style.left === 'number' ? style.left ?? gutter * columnIndex : style.left,
        top: style.top,
        width: typeof style.width === 'number' ? style.width - gutter : style.width,
        height: typeof style.height === 'number' ? style.height - gutter : style.height,
      }}
    >
      <MediaLibraryCard
        key={file.key}
        isSelected={isSelectedFile(file)}
        text={file.name}
        onClick={() => onAssetClick(file)}
        isDraft={file.draft}
        draftText={cardDraftText}
        width={cardWidth}
        height={cardHeight}
        margin={'0px'}
        displayURL={displayURLs[file.id] ?? (file.url ? { url: file.url } : {})}
        loadDisplayURL={() => loadDisplayURL(file)}
        type={file.type}
        isViewableImage={file.isViewableImage ?? false}
        collection={collection}
        field={field}
      />
    </div>
  );
};

const VirtualizedGrid = (props: MediaLibraryCardGridProps) => {
  const {
    cardWidth: inputCardWidth,
    cardHeight: inputCardHeight,
    cardMargin,
    mediaItems,
    scrollContainerRef,
  } = props;

  return (
    <AutoSizer>
      {({ height, width }) => {
        const cardWidth = parseInt(inputCardWidth, 10);
        const cardHeight = parseInt(inputCardHeight, 10);
        const gutter = parseInt(cardMargin, 10);
        const columnWidth = cardWidth + gutter;
        const rowHeight = cardHeight + gutter;
        const columnCount = Math.floor(width / columnWidth);
        const rowCount = Math.ceil(mediaItems.length / columnCount);

        return (
          <div ref={scrollContainerRef}>
            {/* TODO $width={width} $height={height} */}
            <Grid
              columnCount={columnCount}
              columnWidth={columnWidth}
              rowCount={rowCount}
              rowHeight={rowHeight}
              width={width}
              height={height}
              itemData={
                {
                  ...props,
                  gutter,
                  columnCount,
                } as CardGridItemData
              }
              style={{ overflow: 'hidden', overflowY: 'scroll' }}
            >
              {CardWrapper}
            </Grid>
          </div>
        );
      }}
    </AutoSizer>
  );
};

const PaginatedGrid = ({
  scrollContainerRef,
  mediaItems,
  isSelectedFile,
  onAssetClick,
  cardDraftText,
  cardWidth,
  cardHeight,
  cardMargin,
  displayURLs,
  loadDisplayURL,
  canLoadMore,
  onLoadMore,
  isPaginating,
  paginatingMessage,
  collection,
  field,
}: MediaLibraryCardGridProps) => {
  return (
    <div ref={scrollContainerRef}>
      <div>
        {mediaItems.map(file => (
          <MediaLibraryCard
            key={file.key}
            isSelected={isSelectedFile(file)}
            text={file.name}
            onClick={() => onAssetClick(file)}
            isDraft={file.draft}
            draftText={cardDraftText}
            width={cardWidth}
            height={cardHeight}
            margin={cardMargin}
            displayURL={displayURLs[file.id] ?? (file.url ? { url: file.url } : {})}
            loadDisplayURL={() => loadDisplayURL(file)}
            type={file.type}
            isViewableImage={file.isViewableImage ?? false}
            collection={collection}
            field={field}
          />
        ))}
        {!canLoadMore ? null : <Waypoint onEnter={onLoadMore} />}
      </div>
      {!isPaginating ? null : <h1>{paginatingMessage}</h1>}
    </div>
  );
};

function MediaLibraryCardGrid(props: MediaLibraryCardGridProps) {
  const { canLoadMore, isPaginating } = props;
  if (canLoadMore || isPaginating) {
    return <PaginatedGrid {...props} />;
  }
  return <VirtualizedGrid {...props} />;
}

export default MediaLibraryCardGrid;
