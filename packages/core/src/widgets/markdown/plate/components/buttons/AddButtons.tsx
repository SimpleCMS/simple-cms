import { TableAdd } from '@styled-icons/fluentui-system-regular/TableAdd';
import { Add as AddIcon } from '@styled-icons/material/Add';
import { Code as CodeIcon } from '@styled-icons/material/Code';
import { FormatQuote as FormatQuoteIcon } from '@styled-icons/material/FormatQuote';
import {
  ELEMENT_BLOCKQUOTE,
  ELEMENT_CODE_BLOCK,
  ELEMENT_IMAGE,
  ELEMENT_LINK,
  ELEMENT_TABLE,
  insertEmptyCodeBlock,
  insertTable,
  toggleNodeType,
} from '@udecode/plate';
import React, { useCallback } from 'react';

import Menu from '@staticcms/core/components/common/menu/Menu';
import MenuGroup from '@staticcms/core/components/common/menu/MenuGroup';
import MenuItemButton from '@staticcms/core/components/common/menu/MenuItemButton';
import { useMdPlateEditorState } from '../../plateTypes';
import ImageToolbarButton from './ImageToolbarButton';
import LinkToolbarButton from './LinkToolbarButton';

import type { Collection, MarkdownField } from '@staticcms/core/interface';
import type { FC } from 'react';

export const DEFAULT_INSERT_BUTTONS: string[][] = [
  ['blockquote', 'code-block'],
  ['table'],
  ['image', 'file-link'],
];

export interface AddButtonsProps {
  collection: Collection<MarkdownField>;
  field: MarkdownField;
  disabled: boolean;
}

const AddButtons: FC<AddButtonsProps> = ({ collection, field, disabled }) => {
  const editor = useMdPlateEditorState();

  const handleBlockOnClick = useCallback(
    (type: string, inactiveType?: string) => () => {
      toggleNodeType(editor, { activeType: type, inactiveType });
    },
    [editor],
  );

  const handleCodeBlockOnClick = useCallback(() => {
    insertEmptyCodeBlock(editor, {
      insertNodesOptions: { select: true },
    });
  }, [editor]);

  const handleTableAdd = useCallback(() => {
    insertTable(editor, {
      rowCount: 2,
      colCount: 2,
    });
  }, [editor]);

  return (
    <Menu
      label={<AddIcon className="h-5 w-5" aria-hidden="true" />}
      data-testid="toolbar-add-buttons"
      keepMounted
      hideDropdownIcon
      variant="text"
      className="
        py-0.5
        px-0.5
        h-6
        w-6
      "
      disabled={disabled}
    >
      <MenuGroup>
        <MenuItemButton
          key={ELEMENT_BLOCKQUOTE}
          onClick={handleBlockOnClick(ELEMENT_BLOCKQUOTE)}
          startIcon={FormatQuoteIcon}
        >
          Blockquote
        </MenuItemButton>
        <MenuItemButton
          key={ELEMENT_CODE_BLOCK}
          onClick={handleCodeBlockOnClick}
          startIcon={CodeIcon}
        >
          Code Block
        </MenuItemButton>
      </MenuGroup>
      <MenuGroup>
        <MenuItemButton key={ELEMENT_TABLE} onClick={handleTableAdd} startIcon={TableAdd}>
          Table
        </MenuItemButton>
      </MenuGroup>
      <MenuGroup>
        <ImageToolbarButton
          key={ELEMENT_IMAGE}
          collection={collection}
          field={field}
          variant="menu"
          disabled={disabled}
        />
        <LinkToolbarButton
          key={ELEMENT_LINK}
          collection={collection}
          field={field}
          variant="menu"
          disabled={disabled}
        />
      </MenuGroup>
    </Menu>
  );
};

export default AddButtons;
