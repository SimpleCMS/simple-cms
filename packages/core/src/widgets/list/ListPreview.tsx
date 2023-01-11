import React from 'react';

import WidgetPreviewContainer from '@staticcms/core/components/UI/WidgetPreviewContainer';

import type { ListField, ValueOrNestedValue, WidgetPreviewProps } from '@staticcms/core/interface';
import type { FC } from 'react';

const ObjectPreview: FC<WidgetPreviewProps<ValueOrNestedValue[], ListField>> = ({ field }) => {
  return <WidgetPreviewContainer>{field.fields ?? null}</WidgetPreviewContainer>;
};

export default ObjectPreview;
