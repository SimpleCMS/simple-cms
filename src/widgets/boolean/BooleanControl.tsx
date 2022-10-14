import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import React, { useCallback, useState } from 'react';

import type { ChangeEvent } from 'react';
import type { FieldBoolean, WidgetControlProps } from '../../interface';

const BooleanControl = ({
  path,
  field,
  value,
  label,
  onChange,
}: WidgetControlProps<boolean, FieldBoolean>) => {
  const [internalValue, setInternalValue] = useState(value ?? false);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setInternalValue(event.target.checked);
      onChange(path, field, event.target.checked);
    },
    [field, onChange, path],
  );

  return (
    <FormControlLabel
      control={<Switch checked={internalValue} onChange={handleChange} />}
      label={label}
    />
  );
};

export default BooleanControl;
