import { useDraggable } from '@dnd-kit/core';
import React, { useCallback, useMemo } from 'react';

import {
  deleteUnpublishedEntry,
  publishUnpublishedEntry,
} from '@staticcms/core/actions/editorialWorkflow';
import { WorkflowStatus } from '@staticcms/core/constants/publishModes';
import {
  COLLECTION_CARD_HEIGHT,
  COLLECTION_CARD_HEIGHT_WITHOUT_IMAGE,
} from '@staticcms/core/constants/views';
import useTranslate from '@staticcms/core/lib/hooks/useTranslate';
import { getPreviewCard } from '@staticcms/core/lib/registry';
import classNames from '@staticcms/core/lib/util/classNames.util';
import { selectInferredField, selectTemplateName } from '@staticcms/core/lib/util/collection.util';
import { isNotNullish, isNullish } from '@staticcms/core/lib/util/null.util';
import { generateClassNames } from '@staticcms/core/lib/util/theming.util';
import { selectCollection } from '@staticcms/core/reducers/selectors/collections';
import { useAppDispatch, useAppSelector } from '@staticcms/core/store/hooks';
import EntryCard from '../collections/entries/EntryCard';
import Button from '../common/button/Button';
import confirm from '../common/confirm/Confirm';

import type { Entry } from '@staticcms/core/interface';
import type { FC, MouseEvent } from 'react';

import './WorkflowCard.css';

const classes = generateClassNames('WorkflowCard', [
  'root',
  'dragging',
  'actions',
  'action-button',
]);

export interface WorkflowCardProps {
  entry: Entry;
}

const WorkflowCard: FC<WorkflowCardProps> = ({ entry }) => {
  const t = useTranslate();
  const dispatch = useAppDispatch();

  const { isDragging, setNodeRef, listeners } = useDraggable({
    id: `${entry.collection}|${entry.slug}`,
  });

  const collection = useAppSelector(selectCollection(entry.collection));
  const imageFieldName = selectInferredField(collection, 'image');

  const height = useMemo(() => {
    let result = null;

    if (collection) {
      const templateName = selectTemplateName(collection, entry.slug);

      result = getPreviewCard(templateName)?.getHeight?.({ collection, entry }) ?? null;
    }

    if (isNullish(result)) {
      result = isNotNullish(imageFieldName)
        ? COLLECTION_CARD_HEIGHT
        : COLLECTION_CARD_HEIGHT_WITHOUT_IMAGE;
    }

    return result;
  }, [collection, entry, imageFieldName]);

  const handleDeleteChanges = useCallback(
    async (event: MouseEvent) => {
      event.stopPropagation();

      if (
        !(await confirm({
          title: 'editor.editor.onDeleteUnpublishedChangesTitle',
          body: 'editor.editor.onDeleteUnpublishedChangesBody',
          color: 'error',
        }))
      ) {
        return;
      }

      await dispatch(deleteUnpublishedEntry(entry.collection, entry.slug));
    },
    [dispatch, entry.collection, entry.slug],
  );

  const handlePublishEntry = useCallback(
    async (event: MouseEvent) => {
      event.stopPropagation();

      if (entry.status !== WorkflowStatus.PENDING_PUBLISH) {
        alert({
          title: 'editor.editor.onPublishingNotReadyTitle',
          body: {
            key: 'editor.editor.onPublishingNotReadyBody',
          },
        });
        return;
      }

      if (
        !(await confirm({
          title: 'editor.editor.onPublishingTitle',
          body: 'editor.editor.onPublishingBody',
        }))
      ) {
        return;
      }

      await dispatch(publishUnpublishedEntry(entry.collection, entry.slug));
    },
    [dispatch, entry.collection, entry.slug, entry.status],
  );

  return collection ? (
    <div
      ref={setNodeRef}
      className={classNames(classes.root, isDragging && classes.dragging)}
      style={{
        height,
        opacity: isDragging ? 0 : undefined,
      }}
      {...listeners}
    >
      <EntryCard
        entry={entry}
        imageFieldName={imageFieldName}
        collection={collection}
        backTo="/dashboard"
        noMargin
      >
        <div className={classes.actions}>
          <Button
            variant="outlined"
            color="error"
            className={classes['action-button']}
            onClick={handleDeleteChanges}
          >
            {t('workflow.workflowCard.deleteChanges')}
          </Button>
          {entry.status === WorkflowStatus.PENDING_PUBLISH ? (
            <Button
              variant="contained"
              color="secondary"
              className={classes['action-button']}
              onClick={handlePublishEntry}
            >
              {t('workflow.workflowCard.publishChanges')}
            </Button>
          ) : null}
        </div>
      </EntryCard>
    </div>
  ) : null;
};

export default WorkflowCard;
