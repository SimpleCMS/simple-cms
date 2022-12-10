import { MDXProvider } from '@mdx-js/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { VFileMessage } from 'vfile-message';

import WidgetPreviewContainer from '@staticcms/core/components/UI/WidgetPreviewContainer';
import { getShortcodes } from '../../lib/registry';
import withShortcodeMdxComponent from './mdx/withShortcodeMdxComponent';
import useMdx from './plate/hooks/useMdx';
import { processShortcodeConfigToMdx } from './plate/serialization/slate/processShortcodeConfig';

import type { MarkdownField, WidgetPreviewProps } from '@staticcms/core/interface';
import type { FC } from 'react';

interface FallbackComponentProps {
  error: string;
}

function FallbackComponent({ error }: FallbackComponentProps) {
  const message = new VFileMessage(error);
  message.fatal = true;
  return (
    <pre>
      <code>{String(message)}</code>
    </pre>
  );
}

const MarkdownPreview: FC<WidgetPreviewProps<string, MarkdownField>> = previewProps => {
  const { value } = previewProps;

  const components = useMemo(
    () => ({
      Shortcode: withShortcodeMdxComponent({ previewProps }),
    }),
    [previewProps],
  );

  const [state, setValue] = useMdx(value ?? '');
  const [prevValue, setPrevValue] = useState('');
  useEffect(() => {
    if (prevValue !== value) {
      const parsedValue = processShortcodeConfigToMdx(getShortcodes(), value ?? '');
      // console.log('MDX_PREVIEW value', value, 'parsedValue', parsedValue);
      setPrevValue(parsedValue);
      setValue(parsedValue);
    }
  }, [prevValue, setValue, value]);

  // Create a preview component that can handle errors with try-catch block; for catching invalid JS expressions errors that ErrorBoundary cannot catch.
  const MdxComponent = useCallback(() => {
    if (!state.file) {
      return null;
    }

    try {
      return (state.file.result as FC)({});
    } catch (error) {
      // console.log('MDX_PREVIEW error', error);
      return <FallbackComponent error={String(error)} />;
    }
  }, [state.file]);

  return useMemo(() => {
    if (!value) {
      return null;
    }

    return (
      <WidgetPreviewContainer>
        {state.file && state.file.result ? (
          <MDXProvider components={components}>
            <MdxComponent />
          </MDXProvider>
        ) : null}
      </WidgetPreviewContainer>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [MdxComponent]);
};

export default MarkdownPreview;
