import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { styled } from '@mui/material/styles';
import React, { useCallback, useState } from 'react';

import { transientOptions } from '@staticcms/core/lib';
import { colors, colorsRaw, transitions } from './styles';

import type { ObjectField, TranslatedProps } from '@staticcms/core/interface';
import type { MouseEvent, ReactNode } from 'react';

const TopBarContainer = styled('div')`
  position: relative;
  align-items: center;
  background-color: ${colors.textFieldBorder};
  display: flex;
  justify-content: space-between;
  padding: 2px 8px;
`;

interface ExpandButtonContainerProps {
  $hasError: boolean;
}

const ExpandButtonContainer = styled(
  'div',
  transientOptions,
)<ExpandButtonContainerProps>(
  ({ $hasError }) => `
    display: flex;
    align-items: center;
    color: rgba(0, 0, 0, 0.6);
    font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
    font-weight: 400;
    font-size: 1rem;
    line-height: 1.4375em;
    letter-spacing: 0.00938em;
    ${$hasError ? `color: ${colorsRaw.red}` : ''}
  `,
);

export interface ObjectWidgetTopBarProps {
  allowAdd?: boolean;
  types?: ObjectField[];
  onAdd?: (event: MouseEvent) => void;
  onAddType?: (name: string) => void;
  onCollapseToggle: (event: MouseEvent) => void;
  collapsed: boolean;
  heading: ReactNode;
  label?: string;
  hasError?: boolean;
  testId?: string;
}

const ObjectWidgetTopBar = ({
  allowAdd,
  types,
  onAdd,
  onAddType,
  onCollapseToggle,
  collapsed,
  heading,
  label,
  hasError = false,
  t,
  testId,
}: TranslatedProps<ObjectWidgetTopBarProps>) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);
  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);
  const handleAddType = useCallback(
    (type: ObjectField) => () => {
      handleClose();
      onAddType?.(type.name);
    },
    [handleClose, onAddType],
  );

  const renderTypesDropdown = useCallback(
    (types: ObjectField[]) => {
      return (
        <div>
          <Button
            id="types-button"
            aria-controls={open ? 'types-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
            onClick={handleClick}
            variant="outlined"
            size="small"
            endIcon={<AddIcon fontSize="small" />}
          >
            {t('editor.editorWidgets.list.addType', { item: label })}
          </Button>
          <Menu
            id="types-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{
              'aria-labelledby': 'types-button',
            }}
          >
            {types.map((type, idx) =>
              type ? (
                <MenuItem key={idx} onClick={handleAddType(type)}>
                  {type.label ?? type.name}
                </MenuItem>
              ) : null,
            )}
          </Menu>
        </div>
      );
    },
    [open, handleClick, t, label, anchorEl, handleClose, handleAddType],
  );

  const renderAddButton = useCallback(() => {
    return (
      <Button
        onClick={onAdd}
        endIcon={<AddIcon fontSize="small" />}
        size="small"
        variant="outlined"
        data-testid="add-button"
      >
        {t('editor.editorWidgets.list.add', { item: label })}
      </Button>
    );
  }, [t, label, onAdd]);

  const renderAddUI = useCallback(() => {
    if (!allowAdd) {
      return null;
    }
    if (types && types.length > 0) {
      return renderTypesDropdown(types);
    } else {
      return renderAddButton();
    }
  }, [allowAdd, types, renderTypesDropdown, renderAddButton]);

  return (
    <TopBarContainer data-testid={testId}>
      <ExpandButtonContainer $hasError={hasError}>
        <IconButton onClick={onCollapseToggle} data-testid="expand-button">
          <ExpandMoreIcon
            sx={{
              transform: `rotateZ(${collapsed ? '-90deg' : '0deg'})`,
              transition: `transform ${transitions.main};`,
              color: hasError ? colorsRaw.red : undefined,
            }}
          />
        </IconButton>
        {heading}
      </ExpandButtonContainer>
      {renderAddUI()}
    </TopBarContainer>
  );
};

export default ObjectWidgetTopBar;
