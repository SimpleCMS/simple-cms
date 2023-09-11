/* eslint-disable import/prefer-default-export */
import { generateClassNames } from '@staticcms/core/lib/util/theming.util';

const mediaLibraryClasses = generateClassNames('MediaLibrary', [
  'root',
  'is-dialog',
  'supports-folders',
  'for-image',
  'content-wrapper',
  'content',
  'drop-area',
  'drop-area-active',
  'controls',
  'upload-controls',
  'upload-button',
  'upload-button-icon',
  'upload-button-input',
  'header',
  'title',
  'title-icon-wrapper',
  'title-icon',
  'folder-controls',
  'folder-controls-icon',
  'folder',
  'folder-icon',
  'copy-to-clipboard-button',
  'copy-to-clipboard-button-icon',
  'preview',
  'preview-image',
  'preview-details',
  'empty',
  'files',
  'grid-wrapper',
  'grid',
  'search-form',
  'search-label',
  'search-wrapper',
  'search-icon-wrapper',
  'search-icon',
  'search-input',
]);

export default mediaLibraryClasses;
