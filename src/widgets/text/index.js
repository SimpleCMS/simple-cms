import controlComponent from './TextControl';
import previewComponent from './TextPreview';

function Widget(opts = {}) {
  return {
    name: 'text',
    controlComponent,
    previewComponent,
    ...opts,
  };
}

export const StaticCmsWidgetText = { Widget, controlComponent, previewComponent };
export default StaticCmsWidgetText;
