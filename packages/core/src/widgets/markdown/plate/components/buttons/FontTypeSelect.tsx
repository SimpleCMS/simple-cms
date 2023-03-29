import OptionUnstyled from '@mui/base/OptionUnstyled';
import SelectUnstyled from '@mui/base/SelectUnstyled';
import {
  ELEMENT_H1,
  ELEMENT_H2,
  ELEMENT_H3,
  ELEMENT_H4,
  ELEMENT_H5,
  ELEMENT_H6,
  ELEMENT_PARAGRAPH,
  focusEditor,
} from '@udecode/plate';
import { someNode, toggleNodeType } from '@udecode/plate-core';
import React, { useCallback, useMemo, useState } from 'react';

import useDebounce from '@staticcms/core/lib/hooks/useDebounce';
import classNames from '@staticcms/core/lib/util/classNames.util';
import { useMdPlateEditorState } from '@staticcms/markdown/plate/plateTypes';

import type { FC, FocusEvent, KeyboardEvent, MouseEvent } from 'react';

type Option = {
  value: string;
  label: string;
};

const types: Option[] = [
  {
    value: ELEMENT_H1,
    label: 'Heading 1',
  },
  {
    value: ELEMENT_H2,
    label: 'Heading 2',
  },
  {
    value: ELEMENT_H3,
    label: 'Heading 3',
  },
  {
    value: ELEMENT_H4,
    label: 'Heading 4',
  },
  {
    value: ELEMENT_H5,
    label: 'Heading 5',
  },
  {
    value: ELEMENT_H6,
    label: 'Heading 6',
  },
  {
    value: ELEMENT_PARAGRAPH,
    label: 'Paragraph',
  },
];

export interface FontTypeSelectProps {
  disabled?: boolean;
}

/**
 * Toolbar button to toggle the type of elements in selection.
 */
const FontTypeSelect: FC<FontTypeSelectProps> = ({ disabled = false }) => {
  const editor = useMdPlateEditorState();
  const [version, setVersion] = useState(0);

  const selection = useDebounce(editor?.selection, 100);

  const value = useMemo(() => {
    return (
      selection &&
      types.find(type => someNode(editor, { match: { type: type.value }, at: selection?.anchor }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, selection, version]);

  const handleChange = useCallback(
    (_event: KeyboardEvent | FocusEvent | MouseEvent | null, newValue: string | null) => {
      if (!newValue || value?.value === newValue) {
        return;
      }

      toggleNodeType(editor, {
        activeType: newValue,
      });

      setVersion(oldVersion => oldVersion + 1);

      setTimeout(() => {
        focusEditor(editor);
      });
    },
    [editor, value?.value],
  );

  return (
    <div
      className="
        w-28
        h-6
        mx-1
      "
    >
      <SelectUnstyled
        value={value?.value ?? ELEMENT_PARAGRAPH}
        onChange={handleChange}
        disabled={disabled}
        slotProps={{
          root: {
            className: `
              flex
              items-center
              text-sm
              font-medium
              relative
              px-1.5
              py-0.5
              w-full
              h-6
              border
              rounded-sm
              text-gray-900
              border-gray-200
              dark:text-gray-100
            `,
          },
          popper: {
            disablePortal: false,
            className: `
              max-h-40
              w-50
              overflow-auto
              rounded-md
              bg-white
              text-base
              shadow-lg
              ring-1
              ring-black
              ring-opacity-5
              focus:outline-none
              sm:text-sm
              dark:bg-slate-800
            `,
          },
        }}
        data-testid="font-type-select"
      >
        {types.map(type => {
          const selected = (value?.value ?? ELEMENT_PARAGRAPH) === type.value;

          return (
            <OptionUnstyled
              key={type.value}
              value={type.value}
              slotProps={{
                root: {
                  className: classNames(
                    `
                      relative
                      select-none
                      py-2
                      px-4
                      cursor-pointer
                      hover:bg-blue-500
                      hover:text-white
                      dark:hover:bg-blue-500
                    `,
                    selected &&
                      `
                        bg-blue-500/25
                        dark:bg-blue-700/20
                      `,
                  ),
                },
              }}
            >
              <span
                className={classNames('block truncate', selected ? 'font-medium' : 'font-normal')}
              >
                {type.label}
              </span>
            </OptionUnstyled>
          );
        })}
      </SelectUnstyled>
    </div>
  );
};

export default FontTypeSelect;
