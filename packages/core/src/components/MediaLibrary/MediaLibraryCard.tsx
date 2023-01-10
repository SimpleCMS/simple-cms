import { styled } from '@mui/material/styles';
import React, { useEffect } from 'react';

import { borders, colors, effects, lengths, shadows } from '@staticcms/core/components/UI/styles';
import useMediaAsset from '@staticcms/core/lib/hooks/useMediaAsset';
import transientOptions from '@staticcms/core/lib/util/transientOptions';

import type { MediaLibraryDisplayURL } from '@staticcms/core/reducers/mediaLibrary';

const IMAGE_HEIGHT = 160;

interface CardProps {
  $width: string;
  $height: string;
  $margin: string;
  $isSelected: boolean;
}

const Card = styled(
  'div',
  transientOptions,
)<CardProps>(
  ({ $width, $height, $margin, $isSelected }) => `
    width: ${$width};
    height: ${$height};
    margin: ${$margin};
    border: ${borders.textField};
    ${$isSelected ? `border-color: ${colors.active};` : ''}
    border-radius: ${lengths.borderRadius};
    cursor: pointer;
    overflow: hidden;

    &:focus {
      outline: none;
    }
  `,
);

const CardImageWrapper = styled('div')`
  height: ${IMAGE_HEIGHT + 2}px;
  ${effects.checkerboard};
  ${shadows.inset};
  border-bottom: solid ${lengths.borderWidth} ${colors.textFieldBorder};
  position: relative;
`;

const CardImage = styled('img')`
  width: 100%;
  height: ${IMAGE_HEIGHT}px;
  object-fit: contain;
  border-radius: 2px 2px 0 0;
`;

const CardFileIcon = styled('div')`
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 2px 2px 0 0;
  padding: 1em;
  font-size: 3em;
`;

const CardText = styled('p')`
  color: ${colors.text};
  padding: 8px;
  margin-top: 20px;
  overflow-wrap: break-word;
  line-height: 1.3;
`;

const DraftText = styled('p')`
  color: ${colors.mediaDraftText};
  background-color: ${colors.mediaDraftBackground};
  position: absolute;
  padding: 8px;
  border-radius: ${lengths.borderRadius} 0 ${lengths.borderRadius} 0;
`;

interface MediaLibraryCardProps {
  isSelected?: boolean;
  displayURL: MediaLibraryDisplayURL;
  text: string;
  onClick: () => void;
  draftText: string;
  width: string;
  height: string;
  margin: string;
  type?: string;
  isViewableImage: boolean;
  loadDisplayURL: () => void;
  isDraft?: boolean;
}

const MediaLibraryCard = ({
  isSelected = false,
  displayURL,
  text,
  onClick,
  draftText,
  width,
  height,
  margin,
  type,
  isViewableImage,
  isDraft,
  loadDisplayURL,
}: MediaLibraryCardProps) => {
  const url = useMediaAsset(displayURL.url);

  useEffect(() => {
    if (!displayURL.url) {
      loadDisplayURL();
    }
  }, [displayURL.url, loadDisplayURL]);

  return (
    <Card
      $isSelected={isSelected}
      $width={width}
      $height={height}
      $margin={margin}
      onClick={onClick}
      tabIndex={-1}
    >
      <CardImageWrapper>
        {isDraft ? <DraftText data-testid="draft-text">{draftText}</DraftText> : null}
        {url && isViewableImage ? (
          <CardImage src={url} />
        ) : (
          <CardFileIcon data-testid="card-file-icon">{type}</CardFileIcon>
        )}
      </CardImageWrapper>
      <CardText>{text}</CardText>
    </Card>
  );
};

export default MediaLibraryCard;
