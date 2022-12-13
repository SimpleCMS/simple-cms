import { focusEditor } from '@udecode/plate-core';
import React, { useCallback, useEffect, useState } from 'react';

import MediaPopover from '../../common/MediaPopover';
import { useMdPlateEditorState } from '@staticcms/markdown/plate/plateTypes';
import ToolbarButton from './ToolbarButton';

import type { MarkdownField } from '@staticcms/core/interface';
import type { MdEditor, MediaPopoverProps } from '@staticcms/markdown';
import type { FC, MouseEvent } from 'react';
import type { ToolbarButtonProps } from './ToolbarButton';

export interface MediaToolbarButtonProps
  extends Omit<ToolbarButtonProps, 'onClick'>,
    Pick<
      MediaPopoverProps<MarkdownField>,
      'collection' | 'field' | 'entry' | 'inserting' | 'forImage' | 'textLabel'
    > {
  containerRef: HTMLElement | null;
  mediaOpen: boolean;
  onMediaToggle: (open: boolean) => void;
  onChange: (newUrl: string, newText: string | undefined) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

const MediaToolbarButton: FC<MediaToolbarButtonProps> = ({
  containerRef,
  collection,
  field,
  entry,
  inserting,
  forImage,
  textLabel,
  mediaOpen,
  onMediaToggle,
  onChange,
  onFocus,
  onBlur,
  ...props
}) => {
  const editor = useMdPlateEditorState();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const [internalUrl, setInternalUrl] = useState('');
  const [internalText, setInternalText] = useState('');

  const handleClose = useCallback(
    (newValue: string | undefined, shouldFocus: boolean) => {
      setAnchorEl(null);
      setInternalUrl('');
      setInternalText('');
      if (shouldFocus) {
        focusEditor(editor, editor.selection ?? editor.prevSelection!);
      }
      const finalValue = newValue ?? internalUrl;
      if (finalValue) {
        console.log('CLOSING ON CHANGE', finalValue, internalText);
        onChange(finalValue, internalText);
      }
    },
    [editor, onChange, internalUrl, internalText],
  );

  const handleOnClick = useCallback(
    (_editor: MdEditor, event: MouseEvent<HTMLButtonElement>) => {
      if (anchorEl) {
        handleClose(undefined, true);
        return;
      }

      setAnchorEl(event.currentTarget);
    },
    [anchorEl, handleClose],
  );

  const handleMediaChange = useCallback(
    (newValue: string) => {
      handleClose(newValue, true);
    },
    [handleClose],
  );

  const handlePopoverClose = useCallback(
    (shouldFocus: boolean) => {
      handleClose(undefined, shouldFocus);
    },
    [handleClose],
  );

  useEffect(() => {
    if (anchorEl && !mediaOpen) {
      handleClose(undefined, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaOpen]);

  return (
    <>
      <ToolbarButton onClick={handleOnClick} disableFocusAfterClick {...props} />
      <MediaPopover
        containerRef={containerRef}
        anchorEl={anchorEl}
        collection={collection}
        field={field}
        entry={entry}
        url={internalUrl}
        text={internalText}
        inserting={inserting}
        forImage={forImage}
        textLabel={textLabel}
        onUrlChange={setInternalUrl}
        onTextChange={setInternalText}
        mediaOpen={mediaOpen}
        onMediaToggle={onMediaToggle}
        onMediaChange={handleMediaChange}
        onClose={handlePopoverClose}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </>
  );
};

export default MediaToolbarButton;
