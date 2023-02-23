import { useMemo } from 'react';

import type { BaseBaseProps } from './Button';

const classes: Record<
  Required<BaseBaseProps>['variant'],
  Record<Required<BaseBaseProps>['color'], string>
> = {
  contained: {
    primary: 'btn-contained-primary',
    error: 'btn-contained-error',
  },
  outlined: {
    primary: 'btn-outlined-primary',
    error: 'btn-outlined-error',
  },
  text: {
    primary: 'btn-text-primary',
    error: 'btn-text-error',
  },
};

export default function useButtonClassName(
  variant: Required<BaseBaseProps>['variant'],
  color: Required<BaseBaseProps>['color'],
  rounded: boolean,
) {
  return useMemo(
    () => `${rounded ? 'btn-rounded' : 'btn'} ${classes[variant][color]}`,
    [color, rounded, variant],
  );
}
