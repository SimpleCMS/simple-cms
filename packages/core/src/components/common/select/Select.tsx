import SelectUnstyled from '@mui/base/SelectUnstyled';
import { KeyboardArrowDown as KeyboardArrowDownIcon } from '@styled-icons/material/KeyboardArrowDown';
import React, { forwardRef, useCallback } from 'react';

import classNames from '@staticcms/core/lib/util/classNames.util';
import { isNotEmpty } from '@staticcms/core/lib/util/string.util';
import Option from './Option';

import type { FocusEvent, KeyboardEvent, MouseEvent, ReactNode, Ref } from 'react';

export interface Option {
  label: string;
  value: number | string;
}

function getOptionLabelAndValue(option: number | string | Option): Option {
  if (option && typeof option === 'object' && 'label' in option && 'value' in option) {
    return option;
  }

  return { label: String(option), value: option };
}

export type SelectChangeEventHandler = (value: number | string | (number | string)[]) => void;

export interface SelectProps {
  label?: ReactNode | ReactNode[];
  placeholder?: string;
  value: number | string | (number | string)[];
  options: (number | string)[] | Option[];
  required?: boolean;
  disabled?: boolean;
  onChange: SelectChangeEventHandler;
}

const Select = forwardRef(
  (
    { label, placeholder, value, options, required = false, disabled, onChange }: SelectProps,
    ref: Ref<HTMLButtonElement>,
  ) => {
    const handleChange = useCallback(
      (_event: MouseEvent | KeyboardEvent | FocusEvent | null, selectedValue: number | string) => {
        if (Array.isArray(value)) {
          const newValue = [...value];
          const index = newValue.indexOf(selectedValue);
          if (index > -1) {
            newValue.splice(index, 1);
          } else if (typeof selectedValue === 'number' || isNotEmpty(selectedValue)) {
            newValue.push(selectedValue);
          }

          onChange(newValue);
          return;
        }

        onChange(selectedValue);
      },
      [onChange, value],
    );

    return (
      <div className="relative w-full">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <SelectUnstyled<any>
          renderValue={() => {
            return (
              <>
                {label ?? placeholder}
                <span
                  className="
                    pointer-events-none
                    absolute
                    inset-y-0
                    right-0
                    flex
                    items-center
                    pr-2
                  "
                >
                  <KeyboardArrowDownIcon
                    className={classNames(
                      `
                        h-5
                        w-5
                        text-gray-400
                      `,
                      disabled &&
                        `
                          text-gray-300/75
                          dark:text-gray-600/75
                        `,
                    )}
                    aria-hidden="true"
                  />
                </span>
              </>
            );
          }}
          slotProps={{
            root: {
              ref,
              className: classNames(
                `
                  flex
                  items-center
                  text-sm
                  font-medium
                  relative
                  min-h-8
                  px-4
                  py-1.5
                  w-full
                  text-gray-900
                  dark:text-gray-100
                `,
                disabled &&
                  `
                    text-gray-300/75
                    dark:text-gray-600/75
                  `,
              ),
            },
            popper: {
              className: `
                absolute
                max-h-60
                overflow-auto
                rounded-md
                bg-white
                py-1
                text-base
                shadow-lg
                ring-1
                ring-black
                ring-opacity-5
                focus:outline-none
                sm:text-sm
                z-50
                dark:bg-slate-700
              `,
              disablePortal: false,
            },
          }}
          value={value}
          disabled={disabled}
          onChange={handleChange}
          data-testid="select-input"
        >
          {!Array.isArray(value) && !required ? (
            <Option value="" selectedValue={value}>
              <i>None</i>
            </Option>
          ) : null}
          {options.map((option, index) => {
            const { label: optionLabel, value: optionValue } = getOptionLabelAndValue(option);

            return (
              <Option
                key={index}
                value={optionValue}
                selectedValue={value}
                data-testid={`select-option-${optionValue}`}
              >
                {optionLabel}
              </Option>
            );
          })}
        </SelectUnstyled>
      </div>
    );
  },
);

Select.displayName = 'Select';

export default Select;
