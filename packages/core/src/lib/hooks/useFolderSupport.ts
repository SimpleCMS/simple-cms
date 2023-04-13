import { useMemo } from 'react';

import type { Collection, CollectionFile, Config, MediaField } from '@staticcms/core/interface';

interface UseFolderSupportProps {
  config?: Config;
  collection?: Collection;
  collectionFile?: CollectionFile;
  field?: MediaField;
}

export function getFolderSupport({
  config,
  collection,
  collectionFile,
  field,
}: UseFolderSupportProps) {
  console.log(
    '[FOLDER SUPPORT] config',
    config?.media_library?.folder_support,
    'collection',
    collection,
    'collectionFile',
    collectionFile,
    'field',
    field?.media_library?.folder_support,
  );
  return (field ?? collectionFile ?? collection ?? config)?.media_library?.folder_support ?? false;
}

export default function useFolderSupport(props: UseFolderSupportProps) {
  return useMemo(() => getFolderSupport(props), [props]);
}
