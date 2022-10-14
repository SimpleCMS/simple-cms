import React from 'react';

import WidgetPreviewContainer from '../../components/UI/WidgetPreviewContainer';

import type {
  WidgetPreviewProps,
  FieldObject,
  ValueOrNestedValue,
  FieldList,
  ObjectValue,
} from '../../interface';

function ObjectPreview({
  value,
}: WidgetPreviewProps<
  | {
      [key: string]: ValueOrNestedValue;
    }
  | ObjectValue[],
  FieldObject | FieldList
>) {
  return <WidgetPreviewContainer>{JSON.stringify(value, null, 2)}</WidgetPreviewContainer>;
}

export default ObjectPreview;
