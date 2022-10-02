/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '@staticcms/core' {
  import type { Iterable as ImmutableIterable, List, Map } from 'immutable';
  import type { ComponentType, FocusEventHandler, ReactNode } from 'react';
  import type { t } from 'react-polyglot';
  import type { Pluggable } from 'unified';

  export type CmsBackendType =
    | 'azure'
    | 'git-gateway'
    | 'github'
    | 'gitlab'
    | 'bitbucket'
    | 'test-repo'
    | 'proxy';

  export type CmsMapWidgetType = 'Point' | 'LineString' | 'Polygon';

  export type CmsMarkdownWidgetButton =
    | 'bold'
    | 'italic'
    | 'code'
    | 'link'
    | 'heading-one'
    | 'heading-two'
    | 'heading-three'
    | 'heading-four'
    | 'heading-five'
    | 'heading-six'
    | 'quote'
    | 'code-block'
    | 'bulleted-list'
    | 'numbered-list';

  export interface CmsSelectWidgetOptionObject {
    label: string;
    value: any;
  }

  export type CmsCollectionFormatType =
    | 'yml'
    | 'yaml'
    | 'toml'
    | 'json'
    | 'frontmatter'
    | 'yaml-frontmatter'
    | 'toml-frontmatter'
    | 'json-frontmatter';

  export type CmsAuthScope = 'repo' | 'public_repo';

  export type CmsSlugEncoding = 'unicode' | 'ascii';

  export interface CmsI18nConfig {
    structure: 'multiple_folders' | 'multiple_files' | 'single_file';
    locales: string[];
    default_locale?: string;
  }

  export interface CmsFieldBase {
    name: string;
    label?: string;
    required?: boolean;
    hint?: string;
    pattern?: [string, string];
    i18n?: boolean | 'translate' | 'duplicate' | 'none';
    media_folder?: string;
    public_folder?: string;
    comment?: string;
  }

  export interface CmsFieldBoolean {
    widget: 'boolean';
    default?: boolean;
  }

  export interface CmsFieldCode {
    widget: 'code';
    default?: any;

    default_language?: string;
    allow_language_selection?: boolean;
    keys?: { code: string; lang: string };
    output_code_only?: boolean;
  }

  export interface CmsFieldColor {
    widget: 'color';
    default?: string;

    allowInput?: boolean;
    enableAlpha?: boolean;
  }

  export interface CmsFieldDateTime {
    widget: 'datetime';
    default?: string;

    format?: string;
    date_format?: boolean | string;
    time_format?: boolean | string;
    picker_utc?: boolean;

    /**
     * @deprecated Use date_format instead
     */
    dateFormat?: boolean | string;
    /**
     * @deprecated Use time_format instead
     */
    timeFormat?: boolean | string;
    /**
     * @deprecated Use picker_utc instead
     */
    pickerUtc?: boolean;
  }

  export interface CmsFieldFileOrImage {
    widget: 'file' | 'image';
    default?: string;

    media_library?: CmsMediaLibrary;
    allow_multiple?: boolean;
    config?: any;
  }

  export interface CmsFieldObject {
    widget: 'object';
    default?: any;

    collapsed?: boolean;
    summary?: string;
    fields: CmsField[];
  }

  export interface CmsFieldList {
    widget: 'list';
    default?: any;

    allow_add?: boolean;
    collapsed?: boolean;
    summary?: string;
    minimize_collapsed?: boolean;
    label_singular?: string;
    field?: CmsField;
    fields?: CmsField[];
    max?: number;
    min?: number;
    add_to_top?: boolean;
    types?: (CmsFieldBase & CmsFieldObject)[];
  }

  export interface CmsFieldMap {
    widget: 'map';
    default?: string;

    decimals?: number;
    type?: CmsMapWidgetType;
  }

  export interface CmsFieldMarkdown {
    widget: 'markdown';
    default?: string;

    minimal?: boolean;
    buttons?: CmsMarkdownWidgetButton[];
    editor_components?: string[];
    modes?: ('raw' | 'rich_text')[];

    /**
     * @deprecated Use editor_components instead
     */
    editorComponents?: string[];
  }

  export interface CmsFieldNumber {
    widget: 'number';
    default?: string | number;

    value_type?: 'int' | 'float' | string;
    min?: number;
    max?: number;

    step?: number;

    /**
     * @deprecated Use valueType instead
     */
    valueType?: 'int' | 'float' | string;
  }

  export interface CmsFieldSelect {
    widget: 'select';
    default?: string | string[];

    options: string[] | CmsSelectWidgetOptionObject[];
    multiple?: boolean;
    min?: number;
    max?: number;
  }

  export interface CmsFieldRelation {
    widget: 'relation';
    default?: string | string[];

    collection: string;
    value_field: string;
    search_fields: string[];
    file?: string;
    display_fields?: string[];
    multiple?: boolean;
    options_length?: number;

    /**
     * @deprecated Use value_field instead
     */
    valueField?: string;
    /**
     * @deprecated Use search_fields instead
     */
    searchFields?: string[];
    /**
     * @deprecated Use display_fields instead
     */
    displayFields?: string[];
    /**
     * @deprecated Use options_length instead
     */
    optionsLength?: number;
  }

  export interface CmsFieldHidden {
    widget: 'hidden';
    default?: any;
  }

  export interface CmsFieldStringOrText {
    // This is the default widget, so declaring its type is optional.
    widget?: 'string' | 'text';
    default?: string;
  }

  export interface CmsFieldMeta {
    name: string;
    label: string;
    widget: string;
    required: boolean;
    index_file: string;
    meta: boolean;
  }

  export type CmsField = CmsFieldBase &
    (
      | CmsFieldBoolean
      | CmsFieldCode
      | CmsFieldColor
      | CmsFieldDateTime
      | CmsFieldFileOrImage
      | CmsFieldList
      | CmsFieldMap
      | CmsFieldMarkdown
      | CmsFieldNumber
      | CmsFieldObject
      | CmsFieldRelation
      | CmsFieldSelect
      | CmsFieldHidden
      | CmsFieldStringOrText
      | CmsFieldMeta
    );

  export interface CmsCollectionFile {
    name: string;
    label: string;
    file: string;
    fields: CmsField[];
    label_singular?: string;
    description?: string;
    i18n?: boolean | CmsI18nConfig;
    media_folder?: string;
    public_folder?: string;
    editor?: {
      preview?: boolean;
    };
  }

  export interface ViewFilter {
    label: string;
    field: string;
    pattern: string;
  }

  export interface ViewGroup {
    label: string;
    field: string;
    pattern?: string;
  }

  export type SortDirection = 'Ascending' | 'Descending' | 'None';

  export interface CmsSortableFieldsDefault {
    field: string;
    direction?: SortDirection;
  }

  export interface CmsSortableFields {
    default?: CmsSortableFieldsDefault;
    fields: string[];
  }

  export interface CmsCollection {
    name: string;
    icon?: string;
    label: string;
    label_singular?: string;
    description?: string;
    folder?: string;
    files?: CmsCollectionFile[];
    identifier_field?: string;
    summary?: string;
    slug?: string;
    create?: boolean;
    delete?: boolean;
    hide?: boolean;
    editor?: {
      preview?: boolean;
    };
    publish?: boolean;
    nested?: {
      depth: number;
    };
    meta?: { path?: { label: string; widget: string; index_file: string } };

    /**
     * It accepts the following values: yml, yaml, toml, json, md, markdown, html
     *
     * You may also specify a custom extension not included in the list above, by specifying the format value.
     */
    extension?: string;
    format?: CmsCollectionFormatType;

    frontmatter_delimiter?: string[] | string;
    fields?: CmsField[];
    filter?: { field: string; value: any };
    path?: string;
    media_folder?: string;
    public_folder?: string;
    sortable_fields?: CmsSortableFields;
    view_filters?: ViewFilter[];
    view_groups?: ViewGroup[];
    i18n?: boolean | CmsI18nConfig;
  }

  export interface CmsBackend {
    name: CmsBackendType;
    auth_scope?: CmsAuthScope;
    repo?: string;
    branch?: string;
    api_root?: string;
    site_domain?: string;
    base_url?: string;
    auth_endpoint?: string;
    app_id?: string;
    auth_type?: 'implicit' | 'pkce';
    proxy_url?: string;
    commit_messages?: {
      create?: string;
      update?: string;
      delete?: string;
      uploadMedia?: string;
      deleteMedia?: string;
    };
  }

  export interface CmsSlug {
    encoding?: CmsSlugEncoding;
    clean_accents?: boolean;
    sanitize_replacement?: string;
  }

  export interface CmsLocalBackend {
    url?: string;
    allowed_hosts?: string[];
  }

  export interface CmsConfig {
    backend: CmsBackend;
    collections: CmsCollection[];
    locale?: string;
    site_url?: string;
    display_url?: string;
    logo_url?: string;
    media_folder?: string;
    public_folder?: string;
    media_folder_relative?: boolean;
    media_library?: CmsMediaLibrary;
    load_config_file?: boolean;
    integrations?: {
      hooks: string[];
      provider: string;
      collections?: '*' | string[];
      applicationID?: string;
      apiKey?: string;
      getSignedFormURL?: string;
    }[];
    slug?: CmsSlug;
    i18n?: CmsI18nConfig;
    local_backend?: boolean | CmsLocalBackend;
    editor?: {
      preview?: boolean;
    };
  }

  export interface InitOptions {
    config: CmsConfig;
  }

  export interface EditorComponentField {
    name: string;
    label: string;
    widget: string;
  }

  export interface EditorComponentWidgetOptions {
    id: string;
    label: string;
    widget: string;
    type: string;
  }

  export interface EditorComponentManualOptions {
    id: string;
    label: string;
    fields: EditorComponentField[];
    pattern: RegExp;
    allow_add?: boolean;
    fromBlock: (match: RegExpMatchArray) => any;
    toBlock: (data: any) => string;
    toPreview: (data: any) => string;
  }

  export type EditorComponentOptions = EditorComponentManualOptions | EditorComponentWidgetOptions;

  export interface PreviewStyleOptions {
    raw: boolean;
  }

  export interface PreviewStyle extends PreviewStyleOptions {
    value: string;
  }

  export type CmsBackendClass = Implementation;

  export interface CmsRegistryBackend {
    init: (args: any) => CmsBackendClass;
  }

  export interface CmsWidgetControlProps<T = any> {
    value: T;
    field: Map<string, any>;
    onChange: (value: T) => void;
    forID: string;
    classNameWrapper: string;
    setActiveStyle: FocusEventHandler;
    setInactiveStyle: FocusEventHandler;
    t: t;
  }

  export interface CmsWidgetPreviewProps<T = any> {
    value: T;
    field: Map<string, any>;
    metadata: Map<string, any>;
    getAsset: GetAssetFunction;
    entry: Map<string, any>;
    fieldsMetaData: Map<string, any>;
  }

  export interface CmsWidgetParam<T = any> {
    name: string;
    controlComponent: CmsWidgetControlProps<T>;
    previewComponent?: CmsWidgetPreviewProps<T>;
    validator?: (props: {
      field: Map<string, any>;
      value: T | undefined | null;
      t: t;
    }) => boolean | { error: any } | Promise<boolean | { error: any }>;
    globalStyles?: any;
  }

  export interface CmsWidget<T = any> {
    control: ComponentType<CmsWidgetControlProps<T>>;
    preview?: ComponentType<CmsWidgetPreviewProps<T>>;
    globalStyles?: any;
  }

  export type CmsWidgetValueSerializer = any; // TODO: type properly

  export type CmsMediaLibraryOptions = any; // TODO: type properly

  export interface CmsMediaLibrary {
    name: string;
    config?: CmsMediaLibraryOptions;
  }

  export interface CmsEventListener {
    name: 'prePublish' | 'postPublish' | 'preSave' | 'postSave';
    handler: ({
      entry,
      author,
    }: {
      entry: Map<string, any>;
      author: { login: string; name: string };
    }) => any;
  }

  export type CmsEventListenerOptions = any; // TODO: type properly

  export type CmsLocalePhrases = any; // TODO: type properly

  export interface CmsRegistry {
    backends: {
      [name: string]: CmsRegistryBackend;
    };
    templates: {
      [name: string]: ComponentType<any>;
    };
    previewStyles: PreviewStyle[];
    widgets: {
      [name: string]: CmsWidget;
    };
    editorComponents: Map<string, ComponentType<any>>;
    widgetValueSerializers: {
      [name: string]: CmsWidgetValueSerializer;
    };
    mediaLibraries: CmsMediaLibrary[];
    locales: {
      [name: string]: CmsLocalePhrases;
    };
  }

  type GetAssetFunction = (asset: string) => {
    url: string;
    path: string;
    field?: any;
    fileObj: File;
  };

  export type PreviewTemplateComponentProps = {
    entry: Map<string, any>;
    collection: Map<string, any>;
    widgetFor: (name: any, fields?: any, values?: any, fieldsMetaData?: any) => JSX.Element | null;
    widgetsFor: (name: any) => any;
    getAsset: GetAssetFunction;
    boundGetAsset: (collection: any, path: any) => GetAssetFunction;
    fieldsMetaData: Map<string, any>;
    config: Map<string, any>;
    fields: List<Map<string, any>>;
    isLoadingAsset: boolean;
    window: Window;
    document: Document;
  };

  export interface CMSApi {
    getBackend: (name: string) => CmsRegistryBackend | undefined;
    getEditorComponents: () => Map<string, ComponentType<any>>;
    getRemarkPlugins: () => Array<Pluggable>;
    getLocale: (locale: string) => CmsLocalePhrases | undefined;
    getMediaLibrary: (name: string) => CmsMediaLibrary | undefined;
    resolveWidget: (name: string) => CmsWidget | undefined;
    getPreviewStyles: () => PreviewStyle[];
    getPreviewTemplate: (name: string) => ComponentType<PreviewTemplateComponentProps> | undefined;
    getWidget: (name: string) => CmsWidget | undefined;
    getWidgetValueSerializer: (widgetName: string) => CmsWidgetValueSerializer | undefined;
    init: (options?: InitOptions) => void;
    registerBackend: (name: string, backendClass: CmsBackendClass) => void;
    registerEditorComponent: (options: EditorComponentOptions) => void;
    registerRemarkPlugin: (plugin: Pluggable) => void;
    registerEventListener: (
      eventListener: CmsEventListener,
      options?: CmsEventListenerOptions,
    ) => void;
    registerLocale: (locale: string, phrases: CmsLocalePhrases) => void;
    registerMediaLibrary: (mediaLibrary: CmsMediaLibrary, options?: CmsMediaLibraryOptions) => void;
    registerPreviewStyle: (filePath: string, options?: PreviewStyleOptions) => void;
    registerPreviewTemplate: (
      name: string,
      component: ComponentType<PreviewTemplateComponentProps>,
    ) => void;
    registerWidget: (
      widget: string | CmsWidgetParam | CmsWidgetParam[],
      control?: ComponentType<CmsWidgetControlProps> | string,
      preview?: ComponentType<CmsWidgetPreviewProps>,
    ) => void;
    registerWidgetValueSerializer: (
      widgetName: string,
      serializer: CmsWidgetValueSerializer,
    ) => void;
    registerIcon: (iconName: string, icon: ReactNode) => void;
    getIcon: (iconName: string) => ReactNode;
    registerAdditionalLink: (
      id: string,
      title: string,
      data: string | ComponentType,
      iconName?: string,
    ) => void;
    getAdditionalLinks: () => { title: string; data: string | ComponentType; iconName?: string }[];
    getAdditionalLink: (
      id: string,
    ) => { title: string; data: string | ComponentType; iconName?: string } | undefined;
  }

  export const CMS: CMSApi;

  export default CMS;

  // Backends
  export type DisplayURLObject = { id: string; path: string };

  export type DisplayURL = DisplayURLObject | string;

  export type DataFile = {
    path: string;
    slug: string;
    raw: string;
    newPath?: string;
  };

  export type AssetProxy = {
    path: string;
    fileObj?: File;
    toBase64?: () => Promise<string>;
  };

  export type Entry = {
    dataFiles: DataFile[];
    assets: AssetProxy[];
  };

  export type PersistOptions = {
    newEntry?: boolean;
    commitMessage: string;
    collectionName?: string;
    status?: string;
  };

  export type DeleteOptions = {};

  export type Credentials = { token: string | {}; refresh_token?: string };

  export type User = Credentials & {
    backendName?: string;
    login?: string;
    name: string;
  };

  export interface ImplementationEntry {
    data: string;
    file: { path: string; label?: string; id?: string | null; author?: string; updatedOn?: string };
  }

  export type ImplementationFile = {
    id?: string | null | undefined;
    label?: string;
    path: string;
  };
  export interface ImplementationMediaFile {
    name: string;
    id: string;
    size?: number;
    displayURL?: DisplayURL;
    path: string;
    draft?: boolean;
    url?: string;
    file?: File;
  }

  export type CursorStoreObject = {
    actions: Set<string>;
    data: Map<string, unknown>;
    meta: Map<string, unknown>;
  };

  export type CursorStore = {
    get<K extends keyof CursorStoreObject>(
      key: K,
      defaultValue?: CursorStoreObject[K],
    ): CursorStoreObject[K];
    getIn<V>(path: string[]): V;
    set<K extends keyof CursorStoreObject, V extends CursorStoreObject[K]>(
      key: K,
      value: V,
    ): CursorStoreObject[K];
    setIn(path: string[], value: unknown): CursorStore;
    hasIn(path: string[]): boolean;
    mergeIn(path: string[], value: unknown): CursorStore;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (...args: any[]) => CursorStore;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateIn: (...args: any[]) => CursorStore;
  };

  export type ActionHandler = (action: string) => unknown;

  export class Cursor {
    static create(...args: {}[]): Cursor;
    updateStore(...args: any[]): Cursor;
    updateInStore(...args: any[]): Cursor;
    hasAction(action: string): boolean;
    addAction(action: string): Cursor;
    removeAction(action: string): Cursor;
    setActions(actions: Iterable<string>): Cursor;
    mergeActions(actions: Set<string>): Cursor;
    getActionHandlers(handler: ActionHandler): ImmutableIterable<string, unknown>;
    setData(data: {}): Cursor;
    mergeData(data: {}): Cursor;
    wrapData(data: {}): Cursor;
    unwrapData(): [Map<string, unknown>, Cursor];
    clearData(): Cursor;
    setMeta(meta: {}): Cursor;
    mergeMeta(meta: {}): Cursor;
  }

  class Implementation {
    authComponent: () => void;
    restoreUser: (user: User) => Promise<User>;

    authenticate: (credentials: Credentials) => Promise<User>;
    logout: () => Promise<void> | void | null;
    getToken: () => Promise<string | null>;

    getEntry: (path: string) => Promise<ImplementationEntry>;
    entriesByFolder: (
      folder: string,
      extension: string,
      depth: number,
    ) => Promise<ImplementationEntry[]>;
    entriesByFiles: (files: ImplementationFile[]) => Promise<ImplementationEntry[]>;

    getMediaDisplayURL?: (displayURL: DisplayURL) => Promise<string>;
    getMedia: (folder?: string) => Promise<ImplementationMediaFile[]>;
    getMediaFile: (path: string) => Promise<ImplementationMediaFile>;

    persistEntry: (entry: Entry, opts: PersistOptions) => Promise<void>;
    persistMedia: (file: AssetProxy, opts: PersistOptions) => Promise<ImplementationMediaFile>;
    deleteFiles: (paths: string[], commitMessage: string) => Promise<void>;

    allEntriesByFolder?: (
      folder: string,
      extension: string,
      depth: number,
    ) => Promise<ImplementationEntry[]>;
    traverseCursor?: (
      cursor: Cursor,
      action: string,
    ) => Promise<{ entries: ImplementationEntry[]; cursor: Cursor }>;

    isGitBackend?: () => boolean;
    status: () => Promise<{
      auth: { status: boolean };
      api: { status: boolean; statusPage: string };
    }>;
  }

  export const AzureBackend: Implementation;
  export const BitbucketBackend: Implementation;
  export const GitGatewayBackend: Implementation;
  export const GitHubBackend: Implementation;
  export const GitLabBackend: Implementation;
  export const ProxyBackend: Implementation;
  export const TestBackend: Implementation;

  // Widgets
  export const BooleanWidget: {
    Widget: () => CmsWidgetParam<boolean>;
  };
  export const CodeWidget: {
    Widget: () => CmsWidgetParam<any>;
  };
  export const ColorStringWidget: {
    Widget: () => CmsWidgetParam<string>;
  };
  export const DateTimeWidget: {
    Widget: () => CmsWidgetParam<Date | string>;
  };
  export const FileWidget: {
    Widget: () => CmsWidgetParam<string | string[] | List<string>>;
  };
  export const ImageWidget: {
    Widget: () => CmsWidgetParam<string | string[] | List<string>>;
  };
  export const ListWidget: {
    Widget: () => CmsWidgetParam<List<any>>;
  };
  export const MapWidget: {
    Widget: () => CmsWidgetParam<any>;
  };
  export const MarkdownWidget: {
    Widget: () => CmsWidgetParam<string>;
  };
  export const NumberWidget: {
    Widget: () => CmsWidgetParam<string | number>;
  };
  export const ObjectWidget: {
    Widget: () => CmsWidgetParam<Map<string, any> | Record<string, any>>;
  };
  export const RelationWidget: {
    Widget: () => CmsWidgetParam<any>;
  };
  export const SelectWidget: {
    Widget: () => CmsWidgetParam<string | string[]>;
  };
  export const StringWidget: {
    Widget: () => CmsWidgetParam<string>;
  };
  export const TextWidget: {
    Widget: () => CmsWidgetParam<string>;
  };

  export const MediaLibraryCloudinary: {
    name: string;
    init: ({
      options,
      handleInsert,
    }?: {
      options?: Record<string, any> | undefined;
      handleInsert: any;
    }) => Promise<{
      show: ({
        config,
        allowMultiple,
      }?: {
        config?: Record<string, any> | undefined;
        allowMultiple: boolean;
      }) => any;
      hide: () => any;
      enableStandalone: () => boolean;
    }>;
  };

  export const MediaLibraryUploadcare: {
    name: string;
    init: ({
      options,
      handleInsert,
    }?: {
      options?:
        | {
            config: Record<string, any>;
            settings: Record<string, any>;
          }
        | undefined;
      handleInsert: any;
    }) => Promise<{
      show: ({
        value,
        config,
        allowMultiple,
        imagesOnly,
      }?: {
        value: any;
        config?: Record<string, any> | undefined;
        allowMultiple: boolean;
        imagesOnly?: boolean | undefined;
      }) => any;
      enableStandalone: () => boolean;
    }>;
  };

  export const imageEditorComponent: EditorComponentManualOptions;

  export const locales: {
    cs: Record<string, any>;
    da: Record<string, any>;
    de: Record<string, any>;
    en: Record<string, any>;
    es: Record<string, any>;
    ca: Record<string, any>;
    fr: Record<string, any>;
    gr: Record<string, any>;
    hu: Record<string, any>;
    it: Record<string, any>;
    lt: Record<string, any>;
    ja: Record<string, any>;
    nl: Record<string, any>;
    nb_no: Record<string, any>;
    nn_no: Record<string, any>;
    pl: Record<string, any>;
    pt: Record<string, any>;
    ro: Record<string, any>;
    ru: Record<string, any>;
    sv: Record<string, any>;
    th: Record<string, any>;
    tr: Record<string, any>;
    uk: Record<string, any>;
    vi: Record<string, any>;
    zh_Hant: Record<string, any>;
    ko: Record<string, any>;
    hr: Record<string, any>;
    bg: Record<string, any>;
    zh_Hans: Record<string, any>;
    he: Record<string, any>;
  };

  class NetlifyAuthenticator {
    constructor(config: Record<string, any>);

    refresh: (args: {
      provider: string;
      refresh_token: string;
    }) => Promise<{ token: string; refresh_token: string }>;
  }
  export { NetlifyAuthenticator };

  // Images
  export interface IconProps {
    type: string;
    direction?: 'right' | 'down' | 'left' | 'up';
    size?: string;
    className?: string;
  }

  export const Icon: React.ComponentType<IconProps>;

  export const images: Record<string, ReactNode>;
}
