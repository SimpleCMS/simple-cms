import { useMemo } from 'react';

import { selectUnpublishedEntries } from '@staticcms/core/reducers/selectors/editorialWorkflow';
import { useAppSelector } from '@staticcms/core/store/hooks';

import type { WorkflowStatus } from '@staticcms/core/constants/publishModes';
import type { Entry } from '@staticcms/core/interface';

export type BoardEntry = Entry & { boardStatus: WorkflowStatus };

export default function useWorkflowEntriesByCollection(status: WorkflowStatus) {
  const entities = useAppSelector(selectUnpublishedEntries);

  return useMemo(
    () => Object.values(entities).filter(entry => entry.status === status),
    [entities, status],
  );
}
