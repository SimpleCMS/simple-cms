import type { LanguageName } from '@uiw/codemirror-extensions-langs';
import type { PropertiesSchema } from 'ajv/dist/types/json-schema';
import type {
  ComponentType,
  FC,
  FunctionComponent,
  JSXElementConstructor,
  ReactElement,
  ReactNode,
} from 'react';
import type { TranslateProps as ReactPolyglotTranslateProps, t } from 'react-polyglot';
import type {
  CreateNodeOptions,
  DocumentOptions,
  ParseOptions,
  SchemaOptions,
  ToJSOptions,
  ToStringOptions,
} from 'yaml';
import type { MediaFile as BackendMediaFile } from './backend';
import type { EditorControlProps } from './components/entry-editor/editor-control-pane/EditorControl';
import type {
  SORT_DIRECTION_ASCENDING,
  SORT_DIRECTION_DESCENDING,
  SORT_DIRECTION_NONE,
} from './constants';
import type { Workflow, WorkflowStatus } from './constants/publishModes';
import type {
  BLOCKQUOTE_TOOLBAR_BUTTON,
  BOLD_TOOLBAR_BUTTON,
  CODE_BLOCK_TOOLBAR_BUTTON,
  CODE_TOOLBAR_BUTTON,
  DECREASE_IDENT_TOOLBAR_BUTTON,
  DELETE_COLUMN_TOOLBAR_BUTTON,
  DELETE_ROW_TOOLBAR_BUTTON,
  DELETE_TABLE_TOOLBAR_BUTTON,
  FILE_LINK_TOOLBAR_BUTTON,
  FONT_TOOLBAR_BUTTON,
  IMAGE_TOOLBAR_BUTTON,
  INCRASE_IDENT_TOOLBAR_BUTTON,
  INSERT_COLUMN_TOOLBAR_BUTTON,
  INSERT_ROW_TOOLBAR_BUTTON,
  INSERT_TABLE_TOOLBAR_BUTTON,
  ITALIC_TOOLBAR_BUTTON,
  ORDERED_LIST_TOOLBAR_BUTTON,
  SHORTCODE_TOOLBAR_BUTTON,
  STRIKETHROUGH_TOOLBAR_BUTTON,
  UNORDERED_LIST_TOOLBAR_BUTTON,
} from './constants/toolbar_buttons';
import type { EditorSize, ViewStyle } from './constants/views';
import type { formatExtensions } from './formats/formats';
import type {
  I18N_FIELD_DUPLICATE,
  I18N_FIELD_NONE,
  I18N_FIELD_TRANSLATE,
  I18N_STRUCTURE_MULTIPLE_FILES,
  I18N_STRUCTURE_MULTIPLE_FOLDERS,
  I18N_STRUCTURE_SINGLE_FILE,
} from './lib/i18n';
import type Cursor from './lib/util/Cursor';
import type AssetProxy from './valueObjects/AssetProxy';

export interface Page {
  isFetching?: boolean;
  page?: number;
  ids: string[];
}

export interface Pages {
  [collection: string]: Page;
}

export type SortableField<EF extends BaseField = UnknownField> =
  | {
      key: string;
      name: string;
      label: string;
    }
  | ({
      key: string;
    } & Field<EF>);

export interface SortObject {
  key: string;
  direction: SortDirection;
}

export type SortMap = Record<string, SortObject>;

export type Sort = Record<string, SortMap>;

export type FilterMap = ViewFilterWithDefaults & { active?: boolean };

export type GroupMap = ViewGroupWithDefaults & { active?: boolean };

export type Filter = Record<string, Record<string, FilterMap>>; // collection.field.active

export type Group = Record<string, Record<string, GroupMap>>; // collection.field.active

export interface GroupOfEntries {
  id: string;
  label: string;
  value: string | boolean | undefined;
  paths: Set<string>;
}

export type ObjectValue = {
  [key: string]: ValueOrNestedValue;
};

export type ValueOrNestedValue =
  | string
  | number
  | (string | number)[]
  | boolean
  | ObjectValue
  | Date
  | ValueOrNestedValue[]
  | null
  | undefined;

export type EntryData = ObjectValue | undefined | null;

export interface Entry<T = ObjectValue> {
  collection: string;
  slug: string;
  path: string;
  partial: boolean;
  raw: string;
  data: T | undefined | null;
  label: string | null;
  isModification: boolean | null;
  mediaFiles: MediaFile[];
  author: string;
  updatedOn: string;
  status?: WorkflowStatus;
  newRecord?: boolean;
  openAuthoring?: boolean;
  isFetching?: boolean;
  isPersisting?: boolean;
  isDeleting?: boolean;
  isPublishing?: boolean;
  isUpdatingStatus?: boolean;
  error?: string;
  i18n?: {
    [locale: string]: {
      data: Partial<T>;
    };
  };
  meta?: {
    path: string;
  };
}

export type Entries = Record<string, Entry>;

export interface FieldError {
  type: string;
  message?: string;
}

export interface FieldsErrors {
  [field: string]: FieldError[];
}

export type FieldGetValidValueMethod<T = unknown, F extends BaseField = UnknownField> = (
  value: T | undefined | null,
  field: F,
) => T | undefined | null;

export type FieldGetDefaultMethod<T = unknown, F extends BaseField = UnknownField> = (
  defaultValue: T | undefined | null,
  field: F,
) => T;

export interface FieldValidationMethodProps<T = unknown, F extends BaseField = UnknownField> {
  field: F;
  value: T | undefined | null;
  t: t;
}

export type FieldValidationMethod<T = unknown, F extends BaseField = UnknownField> = (
  props: FieldValidationMethodProps<T, F>,
) => false | FieldError | Promise<false | FieldError>;

export interface FieldStorageConverters<
  T = unknown,
  F extends BaseField = UnknownField,
  S = ValueOrNestedValue,
> {
  deserialize(storageValue: S | null | undefined, field: F): T | null | undefined;
  serialize(cmsValue: T | null | undefined, field: F): S | null | undefined;
}

export interface EntryDraft {
  entry: Entry;
  fieldsErrors: FieldsErrors;
}

export interface BaseFieldFilterRule {
  field: string;
}

export interface FieldPatternFilterRule extends BaseFieldFilterRule {
  pattern: string | RegExp;
}

export interface FieldValueFilterRule extends BaseFieldFilterRule {
  value: string | number | boolean | (string | number | boolean)[];
  matchAll?: boolean;
}

export type FieldFilterRule = FieldPatternFilterRule | FieldValueFilterRule;

export interface FileNameFilterRule {
  pattern: string | RegExp;
}

export type FilterRule = FieldFilterRule | FileNameFilterRule;

export interface BaseEditorConfig {
  size?: EditorSize;
}

export interface DefaultEditorConfig extends BaseEditorConfig {
  preview?: boolean;
  frame?: boolean;
  live_preview?: false;
}

export interface LiveEditorConfig extends BaseEditorConfig {
  live_preview: string;
}

export type EditorConfig = DefaultEditorConfig | LiveEditorConfig;

export interface CollectionFile<EF extends BaseField = UnknownField> {
  name: string;
  label: string;
  file: string;
  fields: Field<EF>[];
  label_singular?: string;
  description?: string;
  media_folder?: string;
  public_folder?: string;
  media_library?: MediaLibraryConfig;
  i18n?: boolean | Partial<I18nInfo>;
  editor?: EditorConfig;
  publish?: boolean;
}

export interface CollectionFileWithDefaults<EF extends BaseField = UnknownField>
  extends Omit<CollectionFile<EF>, 'i18n'> {
  i18n?: I18nInfo;
}

interface Nested {
  summary?: string;
  depth: number;
  path?: {
    label?: string;
    index_file: string;
  };
}

export interface I18nSettings {
  currentLocale: string;
  defaultLocale: string;
  locales: string[];
  enforceRequiredNonDefault?: boolean;
}

export type Format = keyof typeof formatExtensions;

export interface i18nCollection<EF extends BaseField = UnknownField>
  extends Omit<CollectionWithDefaults<EF>, 'i18n'> {
  i18n: Required<CollectionWithDefaults<EF>>['i18n'];
}

export interface BaseCollection {
  name: string;
  description?: string;
  icon?: string;
  isFetching?: boolean;
  summary?: string;
  summary_fields?: string[];
  filter?: FilterRule | FilterRule[];
  label_singular?: string;
  label: string;
  sortable_fields?: SortableFields;
  view_filters?: ViewFilters;
  view_groups?: ViewGroups;
  i18n?: boolean | Partial<I18nInfo>;
  hide?: boolean;
  editor?: EditorConfig;
  identifier_field?: string;
  path?: string;
  extension?: string;
  format?: Format;
  frontmatter_delimiter?: string | [string, string];
  slug?: string;
  media_folder?: string;
  public_folder?: string;
  media_library?: MediaLibraryConfig;
}

export interface BaseCollectionWithDefaults extends Omit<BaseCollection, 'i18n'> {
  i18n?: I18nInfo;
  view_filters?: ViewFiltersWithDefaults;
  view_groups?: ViewGroupsWithDefaults;
}

export interface FilesCollection<EF extends BaseField = UnknownField> extends BaseCollection {
  files: CollectionFile<EF>[];
}

export interface FilesCollectionWithDefaults<EF extends BaseField = UnknownField>
  extends BaseCollectionWithDefaults {
  files: CollectionFileWithDefaults<EF>[];
}

export interface BaseFolderCollection<EF extends BaseField = UnknownField> {
  folder: string;
  fields: Field<EF>[];
  create?: boolean;
  publish?: boolean;
  delete?: boolean;
  nested?: Nested;
  meta?: {
    path: string;
  };
}

export type FolderCollection<EF extends BaseField = UnknownField> = BaseCollection &
  BaseFolderCollection<EF>;

export type FolderCollectionWithDefaults<EF extends BaseField = UnknownField> =
  BaseCollectionWithDefaults & BaseFolderCollection<EF>;

export type Collection<EF extends BaseField = UnknownField> =
  | FilesCollection<EF>
  | FolderCollection<EF>;

export type CollectionWithDefaults<EF extends BaseField = UnknownField> =
  | FilesCollectionWithDefaults<EF>
  | FolderCollectionWithDefaults<EF>;

export type Collections<EF extends BaseField = UnknownField> = Record<string, Collection<EF>>;

export type CollectionsWithDefaults<EF extends BaseField = UnknownField> = Record<
  string,
  CollectionWithDefaults<EF>
>;

export type MediaFile = BackendMediaFile & { key?: string };

export interface DisplayURLState {
  isFetching: boolean;
  url?: string;
  err?: Error;
}

export type TranslatedProps<T> = T & ReactPolyglotTranslateProps;

export interface MediaPath<T = string | string[]> {
  path: T;
  alt?: string;
}

export interface WidgetControlProps<T, F extends BaseField = UnknownField, EV = ObjectValue> {
  collection: CollectionWithDefaults<F>;
  collectionFile: CollectionFileWithDefaults<F> | undefined;
  config: ConfigWithDefaults<F>;
  entry: Entry<EV>;
  field: F;
  fieldsErrors: FieldsErrors;
  submitted: boolean;
  forList: boolean;
  listItemPath: string | undefined;
  forSingleList: boolean;
  disabled: boolean;
  duplicate: boolean;
  label: string;
  locale: string | undefined;
  onChange: (value: T | null | undefined) => void;
  clearChildValidation: () => void;
  i18n: I18nSettings | undefined;
  hasErrors: boolean;
  errors: FieldError[];
  path: string;
  query: EditorControlProps['query'];
  t: t;
  value: T | undefined | null;
  controlled: boolean;
}

export interface WidgetPreviewProps<T = unknown, F extends BaseField = UnknownField> {
  config: ConfigWithDefaults<F>;
  collection: CollectionWithDefaults<F>;
  entry: Entry;
  field: RenderedField<F>;
  value: T | undefined | null;
}

export type WidgetPreviewComponent<T = unknown, F extends BaseField = UnknownField> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | ReactElement<unknown, string | JSXElementConstructor<any>>
  | ComponentType<WidgetPreviewProps<T, F>>;

export type WidgetFor<P = ObjectValue> = <K extends keyof P>(name: K) => ReactNode;

export type WidgetsFor<P = ObjectValue> = <K extends keyof P>(
  name: K,
) => P[K] extends Array<infer U>
  ? {
      data: U | null;
      widgets: Record<keyof U, ReactNode>;
    }[]
  : {
      data: P[K] | null;
      widgets: Record<keyof P[K], ReactNode>;
    };

export interface TemplatePreviewProps<T = ObjectValue, EF extends BaseField = UnknownField> {
  collection: CollectionWithDefaults<EF>;
  fields: Field<EF>[];
  entry: Entry<T>;
  document: Document | undefined | null;
  window: Window | undefined | null;
  widgetFor: WidgetFor<T>;
  widgetsFor: WidgetsFor<T>;
}

export type TemplatePreviewComponent<
  T = ObjectValue,
  EF extends BaseField = UnknownField,
> = ComponentType<TemplatePreviewProps<T, EF>>;

export interface TemplatePreviewCardProps<T = EntryData, EF extends BaseField = UnknownField> {
  collection: CollectionWithDefaults<EF>;
  fields: Field<EF>[];
  entry: Entry<T>;
  status?: WorkflowStatus | 'published';
  widgetFor: WidgetFor<T>;
  widgetsFor: WidgetsFor<T>;
  hasLocalBackup: boolean;
}

export type TemplatePreviewCardComponent<
  T = EntryData,
  EF extends BaseField = UnknownField,
> = ComponentType<TemplatePreviewCardProps<T, EF>>;

export interface FieldPreviewProps<T = unknown, F extends BaseField = UnknownField> {
  collection: CollectionWithDefaults<F>;
  field: Field<F>;
  value: T;
}

export type FieldPreviewComponent<T = unknown, F extends BaseField = UnknownField> = ComponentType<
  FieldPreviewProps<T, F>
>;

export interface WidgetOptions<
  T = unknown,
  F extends BaseField = UnknownField,
  S = ValueOrNestedValue,
> {
  validator?: Widget<T, F>['validator'];
  getValidValue?: Widget<T, F>['getValidValue'];
  converters?: Widget<T, F, S>['converters'];
  getDefaultValue?: Widget<T, F>['getDefaultValue'];
  schema?: Widget<T, F>['schema'];
}

export interface Widget<T = unknown, F extends BaseField = UnknownField, S = ValueOrNestedValue> {
  control: ComponentType<WidgetControlProps<T, F>>;
  preview?: WidgetPreviewComponent<T, F>;
  validator: FieldValidationMethod<T, F>;
  converters: FieldStorageConverters<T, F, S>;
  getValidValue: FieldGetValidValueMethod<T, F>;
  getDefaultValue?: FieldGetDefaultMethod<T, F>;
  schema?: PropertiesSchema<unknown>;
}

export interface WidgetParam<T = unknown, F extends BaseField = UnknownField> {
  name: string;
  controlComponent: Widget<T, F>['control'];
  previewComponent?: Widget<T, F>['preview'];
  options?: WidgetOptions<T, F>;
}

export interface PersistOptions {
  newEntry?: boolean;
  commitMessage: string;
  collectionName?: string;
  status?: WorkflowStatus;

  /**
   * Editorial Workflow
   */
  useWorkflow?: boolean;
  unpublished?: boolean;
}

export interface PersistArgs {
  config: ConfigWithDefaults;
  rootSlug: string | undefined;
  collection: CollectionWithDefaults;
  entryDraft: EntryDraft;
  assetProxies: AssetProxy[];
  usedSlugs: string[];
  status?: WorkflowStatus;
  unpublished?: boolean;
}

export interface ImplementationEntry {
  data: string;
  file: { path: string; label?: string; id?: string | null; author?: string; updatedOn?: string };
}

export interface DisplayURLObject {
  id: string;
  path: string;
}

export type DisplayURL = DisplayURLObject | string;

export interface ImplementationMediaFile {
  name: string;
  id: string;
  size?: number;
  displayURL?: DisplayURL;
  path: string;
  draft?: boolean;
  url?: string;
  file?: File;
  field?: MediaField;
}

export interface DataFile {
  path: string;
  slug: string;
  raw: string;
  newPath?: string;
}

export interface BackendEntry {
  dataFiles: DataFile[];
  assets: AssetProxy[];
}

export interface Credentials {
  token: string | {};
  refresh_token?: string;
}

export type User = Credentials & {
  backendName?: string;
  login?: string;
  name?: string;
  avatar_url?: string;
  useOpenAuthoring?: boolean;
};

export interface ImplementationFile {
  id?: string | null | undefined;
  label?: string;
  path: string;
}

export interface AuthenticatorConfig {
  site_id?: string;
  base_url?: string;
  auth_endpoint?: string;
  auth_token_endpoint?: string;
  auth_url?: string;
  app_id?: string;
  clearHash?: () => void;
}

export abstract class BackendClass {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(_config: ConfigWithDefaults, _options: BackendInitializerOptions) {}

  abstract authComponent(): FC<AuthenticationPageProps>;
  abstract restoreUser(user: User): Promise<User>;

  abstract authenticate(credentials: Credentials): Promise<User>;
  abstract logout(): Promise<void> | void | null;
  abstract getToken(): Promise<string | null>;

  abstract getEntry(path: string): Promise<ImplementationEntry>;
  abstract entriesByFolder(
    folder: string,
    extension: string,
    depth: number,
  ): Promise<ImplementationEntry[]>;
  abstract entriesByFiles(files: ImplementationFile[]): Promise<ImplementationEntry[]>;

  abstract getMediaDisplayURL(displayURL: DisplayURL): Promise<string>;
  abstract getMedia(
    mediaFolder?: string,
    folderSupport?: boolean,
    publicFolder?: string,
  ): Promise<ImplementationMediaFile[]>;
  abstract getMediaFile(path: string): Promise<ImplementationMediaFile>;

  abstract persistEntry(entry: BackendEntry, opts: PersistOptions): Promise<void>;
  abstract persistMedia(file: AssetProxy, opts: PersistOptions): Promise<ImplementationMediaFile>;
  abstract deleteFiles(paths: string[], commitMessage: string): Promise<unknown>;

  abstract allEntriesByFolder(
    folder: string,
    extension: string,
    depth: number,
    pathRegex?: RegExp,
  ): Promise<ImplementationEntry[]>;
  abstract traverseCursor(
    cursor: Cursor,
    action: string,
  ): Promise<{ entries: ImplementationEntry[]; cursor: Cursor }>;

  abstract status(): Promise<{
    auth: { status: boolean };
    api: { status: boolean; statusPage: string };
  }>;

  /**
   * Editorial Workflow
   */
  abstract unpublishedEntries: () => Promise<string[]>;
  abstract unpublishedEntry: (args: {
    id?: string;
    collection?: string;
    slug?: string;
  }) => Promise<UnpublishedEntry>;
  abstract unpublishedEntryDataFile: (
    collection: string,
    slug: string,
    path: string,
    id: string,
  ) => Promise<string>;
  abstract unpublishedEntryMediaFile: (
    collection: string,
    slug: string,
    path: string,
    id: string,
  ) => Promise<ImplementationMediaFile>;
  abstract updateUnpublishedEntryStatus: (
    collection: string,
    slug: string,
    newStatus: WorkflowStatus,
  ) => Promise<void>;
  abstract publishUnpublishedEntry: (collection: string, slug: string) => Promise<void>;
  abstract deleteUnpublishedEntry: (collection: string, slug: string) => Promise<void>;
  abstract getDeployPreview: (
    collectionName: string,
    slug: string,
  ) => Promise<{ url: string; status: string } | null>;
}

export type CustomIcon = FunctionComponent;

export type WidgetValueSerializer = {
  serialize: (value: ValueOrNestedValue) => ValueOrNestedValue;
  deserialize: (value: ValueOrNestedValue) => ValueOrNestedValue;
};

export interface MediaLibraryInitOptions {
  options: Record<string, unknown> | undefined;
  handleInsert: (url: string | string[]) => void;
}

export interface MediaLibraryConfig {
  max_file_size?: number;
  folder_support?: boolean;
}

export interface RootMediaLibraryConfig extends MediaLibraryConfig {
  display_in_navigation?: boolean;
}

export type BackendType =
  | 'git-gateway'
  | 'github'
  | 'gitlab'
  | 'gitea'
  | 'bitbucket'
  | 'test-repo'
  | 'proxy';

export type MapWidgetType = 'Point' | 'LineString' | 'Polygon';

export interface SelectWidgetOptionObject {
  label: string;
  value: string | number;
}

export type AuthScope = 'repo' | 'public_repo';

export type AuthScheme = 'token' | 'Bearer';

export type SlugEncoding = 'unicode' | 'ascii';

export type RenderedField<F extends BaseField = UnknownField> = F & {
  renderedFields?: ReactNode[];
};

export interface BaseField {
  name: string;
  label?: string;
  required?: boolean;
  hint?: string;
  pattern?: [string, string];
  i18n?: boolean | 'translate' | 'duplicate' | 'none';
  comment?: string;
  widget: string;
  condition?: FieldFilterRule | FieldFilterRule[];
}

export interface MediaField extends BaseField {
  media_folder?: string;
  public_folder?: string;
  choose_url?: boolean;
  multiple?: boolean;
  media_library?: MediaLibraryConfig;
  select_folder?: boolean;
}

export interface BooleanField extends BaseField {
  widget: 'boolean';
  default?: boolean;

  prefix?: string;
  suffix?: string;
}

export interface CodeField extends BaseField {
  widget: 'code';
  default?: string | { [key: string]: string };

  default_language?: string;
  allow_language_selection?: boolean;
  keys?: { code: string; lang: string };
  output_code_only?: boolean;

  code_mirror_config?: {
    extra_keys?: Record<string, string>;
  } & Record<string, unknown>;
}

export interface ColorField extends BaseField {
  widget: 'color';
  default?: string;

  allow_input?: boolean;
  enable_alpha?: boolean;
}

export interface DateTimeField extends BaseField {
  widget: 'datetime';
  default?: string;

  format?: string;
  date_format?: boolean | string;
  time_format?: boolean | string;
  picker_utc?: boolean;
}

export interface FileOrImageField extends MediaField {
  widget: 'file' | 'image';
  default?: string;
}

export interface ObjectField<EF extends BaseField = UnknownField> extends BaseField {
  widget: 'object';

  collapsed?: boolean;
  summary?: string;
  fields: Field<EF>[];
}

export interface KeyValueField extends BaseField {
  widget: 'keyvalue';
  default?: Record<string, string>;

  label_singular?: string;
  key_label?: string;
  value_label?: string;

  min?: number;
  max?: number;
}

export interface ListField<EF extends BaseField = UnknownField> extends BaseField {
  widget: 'list';
  default?: ValueOrNestedValue[];

  allow_add?: boolean;
  collapsed?: boolean;
  summary?: string;
  label_singular?: string;
  fields?: Field<EF>[];
  max?: number;
  min?: number;
  add_to_top?: boolean;
  types?: ObjectField<EF>[];
  type_key?: string;
  delimiter?: string;
}

export interface MapField extends BaseField {
  widget: 'map';
  default?: string;

  decimals?: number;
  type?: MapWidgetType;
  height?: string;
}

export type MarkdownToolbarButtonType =
  | LowLevelMarkdownToolbarButtonType
  | typeof FONT_TOOLBAR_BUTTON
  | typeof SHORTCODE_TOOLBAR_BUTTON;

export type LowLevelMarkdownToolbarButtonType =
  | typeof BLOCKQUOTE_TOOLBAR_BUTTON
  | typeof BOLD_TOOLBAR_BUTTON
  | typeof CODE_BLOCK_TOOLBAR_BUTTON
  | typeof CODE_TOOLBAR_BUTTON
  | typeof DECREASE_IDENT_TOOLBAR_BUTTON
  | typeof DELETE_COLUMN_TOOLBAR_BUTTON
  | typeof DELETE_ROW_TOOLBAR_BUTTON
  | typeof DELETE_TABLE_TOOLBAR_BUTTON
  | typeof INCRASE_IDENT_TOOLBAR_BUTTON
  | typeof INSERT_COLUMN_TOOLBAR_BUTTON
  | typeof IMAGE_TOOLBAR_BUTTON
  | typeof FILE_LINK_TOOLBAR_BUTTON
  | typeof INSERT_ROW_TOOLBAR_BUTTON
  | typeof INSERT_TABLE_TOOLBAR_BUTTON
  | typeof ITALIC_TOOLBAR_BUTTON
  | typeof ORDERED_LIST_TOOLBAR_BUTTON
  | typeof STRIKETHROUGH_TOOLBAR_BUTTON
  | typeof UNORDERED_LIST_TOOLBAR_BUTTON;

export type MarkdownToolbarItem =
  | MarkdownToolbarButtonType
  | {
      label: string;
      icon?: string;
      groups: {
        items: LowLevelMarkdownToolbarButtonType[];
      }[];
    };

export interface MarkdownFieldToolbarButtons {
  main?: MarkdownToolbarItem[];
  empty?: MarkdownToolbarItem[];
  selection?: MarkdownToolbarItem[];
  table_empty?: MarkdownToolbarItem[];
  table_selection?: MarkdownToolbarItem[];
}

export interface MarkdownField extends MediaField {
  widget: 'markdown';
  toolbar_buttons?: MarkdownFieldToolbarButtons;
  default?: string;
  show_raw?: boolean;
}

export interface NumberField extends BaseField {
  widget: 'number';
  default?: string | number;

  value_type?: 'int' | 'float' | 'string';
  min?: number;
  max?: number;

  step?: number;

  prefix?: string;
  suffix?: string;
}

export interface SelectField extends BaseField {
  widget: 'select';
  default?: string | number | (string | number)[];

  options: (string | number)[] | SelectWidgetOptionObject[];
  multiple?: boolean;
  min?: number;
  max?: number;
}

export interface RelationField extends BaseField {
  widget: 'relation';
  default?: string | string[];

  collection: string;
  value_field: string;
  search_fields: string[];
  file?: string;
  display_fields?: string[];
  multiple?: boolean;
  min?: number;
  max?: number;
  options_length?: number;
}

export interface HiddenField extends BaseField {
  widget: 'hidden';
  default?: ValueOrNestedValue;
}

export interface StringField extends BaseField {
  widget: 'string';
  default?: string;
  prefix?: string;
  suffix?: string;
}

export interface TextField extends BaseField {
  widget: 'text';
  default?: string;
}

export interface UUIDField extends BaseField {
  widget: 'uuid';
  allow_regenerate?: boolean;
  prefix?: string;
}

export interface UnknownField extends BaseField {
  widget: 'unknown';
}

export type Field<EF extends BaseField = UnknownField> =
  | BooleanField
  | CodeField
  | ColorField
  | DateTimeField
  | FileOrImageField
  | KeyValueField
  | ListField<EF>
  | MapField
  | MarkdownField
  | NumberField
  | ObjectField<EF>
  | RelationField
  | SelectField
  | HiddenField
  | StringField
  | TextField
  | UUIDField
  | EF;

export interface ViewFilter {
  id?: string;
  name: string;
  label: string;
  field: string;
  pattern: string | boolean | number;
}

export interface ViewFilterWithDefaults extends ViewFilter {
  id: string;
}

export interface ViewFilters {
  default?: string;
  filters: ViewFilter[];
}

export interface ViewFiltersWithDefaults extends ViewFilters {
  filters: ViewFilterWithDefaults[];
}

export interface ViewGroup {
  id?: string;
  name: string;
  label: string;
  field: string;
  pattern?: string;
}

export interface ViewGroupWithDefaults extends ViewGroup {
  id: string;
}

export interface ViewGroups {
  default?: string;
  groups: ViewGroup[];
}

export interface ViewGroupsWithDefaults extends ViewGroups {
  groups: ViewGroupWithDefaults[];
}

export type SortDirection =
  | typeof SORT_DIRECTION_ASCENDING
  | typeof SORT_DIRECTION_DESCENDING
  | typeof SORT_DIRECTION_NONE;

export interface SortableFieldsDefault {
  field: string;
  direction?: SortDirection;
}

export interface SortableFields {
  default?: SortableFieldsDefault;
  fields: string[];
}

export interface Backend {
  name: BackendType;
  repo?: string;
  branch?: string;
  api_root?: string;
  site_domain?: string;
  base_url?: string;
  auth_endpoint?: string;
  app_id?: string;
  auth_type?: 'implicit' | 'pkce';
  proxy_url?: string;
  large_media_url?: string;
  login?: boolean;
  identity_url?: string;
  gateway_url?: string;
  auth_scope?: AuthScope;
  auth_scheme?: AuthScheme;
  authenticate_as_github_app?: boolean;
  commit_messages?: {
    create?: string;
    update?: string;
    delete?: string;
    uploadMedia?: string;
    deleteMedia?: string;
    openAuthoring?: string;
  };
  use_large_media_transforms_in_media_library?: boolean;

  /**
   * Editorial Workflow
   */
  always_fork?: boolean;
  open_authoring?: boolean;
  squash_merges?: boolean;
  cms_label_prefix?: string;
  preview_context?: string;
}

export interface Slug {
  encoding?: SlugEncoding;
  clean_accents?: boolean;
  sanitize_replacement?: string;
}

export interface LocalBackend {
  url?: string;
  allowed_hosts?: string[];
}

export interface Config<EF extends BaseField = UnknownField> {
  backend: Backend;
  collections: Collection<EF>[];
  locale?: string;
  site_id?: string;
  site_url?: string;
  display_url?: string;
  base_url?: string;
  logo_url?: string;
  logo_link?: string;
  media_folder?: string;
  public_folder?: string;
  media_folder_relative?: boolean;
  media_library?: RootMediaLibraryConfig;
  publish_mode?: Workflow;
  slug?: Slug;
  i18n?: I18nInfo;
  local_backend?: boolean | LocalBackend;
  disable_local_backup?: boolean;
  editor?: EditorConfig;
  search?: boolean;
  theme?: Themes;
  yaml?: {
    documentOptions?: DocumentOptions;
    schemaOptions?: SchemaOptions;
    createNodeOptions?: CreateNodeOptions;
    parseOptions?: ParseOptions;
    toJsOptions?: ToJSOptions;
    toStringOptions?: ToStringOptions;
  };
}

export interface ConfigWithDefaults<EF extends BaseField = UnknownField>
  extends Omit<Config<EF>, 'collections'> {
  collections: CollectionWithDefaults<EF>[];
}

export interface ThemeColor {
  main: string;
  light: string;
  dark: string;
  contrastColor: string;
}

export interface Theme {
  name: string;
  common: {
    gray: string;
  };
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
  background: {
    main: string;
    light: string;
    dark: string;
    divider: string;
  };
  scrollbar: {
    main: string;
    light: string;
  };
  primary: ThemeColor;
  error: ThemeColor;
  warning: ThemeColor;
  info: ThemeColor;
  success: ThemeColor;
  codemirror: {
    theme: 'light' | 'dark';
  };
}

export interface PartialTheme extends DeepPartial<Omit<Theme, 'name'>> {
  name: string;
  extends: 'light' | 'dark';
}

export interface Themes {
  default_theme?: string;
  include_built_in_themes?: boolean;
  themes?: (Theme | PartialTheme)[];
}

export interface BackendInitializerOptions {
  updateUserCredentials: (credentials: Credentials) => void;
  /**
   * Editorial Workflow
   */
  useWorkflow: boolean;
  initialWorkflowStatus: WorkflowStatus;
}

export interface BackendInitializer<EF extends BaseField = UnknownField> {
  init: (config: ConfigWithDefaults<EF>, options: BackendInitializerOptions) => BackendClass;
}

export interface AuthorData {
  login: string | undefined;
  name: string;
}

export interface EventData {
  entry: Entry;
  author: AuthorData;
}

export interface PrePublishEventListener {
  name: 'prePublish';
  collection?: string;
  file?: string;
  handler: (event: {
    data: EventData;
    collection: string;
    file: string | undefined;
  }) => void | Promise<void>;
}

export interface PostPublishEventListener {
  name: 'postPublish';
  collection?: string;
  file?: string;
  handler: (event: {
    data: EventData;
    collection: string;
    file: string | undefined;
  }) => void | Promise<void>;
}

export interface PreSaveEventListener {
  name: 'preSave';
  collection?: string;
  file?: string;
  handler: (event: {
    data: EventData;
    collection: string;
    file: string | undefined;
  }) => EntryData | undefined | null | void | Promise<EntryData | undefined | null | void>;
}

export interface PostSaveEventListener {
  name: 'postSave';
  collection?: string;
  file?: string;
  handler: (event: {
    data: EventData;
    collection: string;
    file: string | undefined;
  }) => void | Promise<void>;
}

export interface MountedEventListener {
  name: 'mounted';
  handler: () => void | Promise<void>;
}

export interface LoginEventListener {
  name: 'login';
  handler: (event: { author: AuthorData }) => void | Promise<void>;
}

export interface LogoutEventListener {
  name: 'logout';
  handler: () => void | Promise<void>;
}

export interface ChangeEventListener {
  name: 'change';
  collection?: string;
  file?: string;
  field?: string;
  handler: (event: {
    data: EntryData;
    collection: string;
    file: string | undefined;
    field: string;
  }) => EntryData | undefined | null | void | Promise<EntryData | undefined | null | void>;
}

export type EventListener =
  | PrePublishEventListener
  | PostPublishEventListener
  | PreSaveEventListener
  | PostSaveEventListener
  | ChangeEventListener
  | LoginEventListener
  | LogoutEventListener
  | MountedEventListener;

export interface AdditionalLinkOptions {
  icon?: string;
}

export interface AdditionalLink {
  id: string;
  title: string;
  data: string | FunctionComponent;
  options?: AdditionalLinkOptions;
}

export interface AuthenticationPageProps {
  onLogin: (user: User) => void;
  inProgress?: boolean;
  base_url?: string;
  siteId?: string;
  authEndpoint?: string;
  config: ConfigWithDefaults;
  error?: string | undefined;
  clearHash?: () => void;
}

export interface SearchResponse {
  entries: Entry[];
  pagination: number;
}

export type SearchQueryRequest = {
  id: string;
  expires: Date;
  queryResponse: Promise<SearchQueryResponse>;
};

export interface SearchQueryResponse {
  hits: Entry[];
  query: string;
}

export interface EditorPersistOptions {
  createNew?: boolean;
  duplicate?: boolean;
}

export type I18nStructure =
  | typeof I18N_STRUCTURE_MULTIPLE_FILES
  | typeof I18N_STRUCTURE_MULTIPLE_FOLDERS
  | typeof I18N_STRUCTURE_SINGLE_FILE;

export type I18nField =
  | typeof I18N_FIELD_DUPLICATE
  | typeof I18N_FIELD_TRANSLATE
  | typeof I18N_FIELD_NONE;

export interface I18nInfo {
  locales: string[];
  default_locale?: string;
  structure: I18nStructure;
  enforce_required_non_default?: boolean;
}

export interface ProcessedCodeLanguage {
  label: string;
  identifiers: string[];
  codemirror_mode: LanguageName;
  codemirror_mime_type: string;
}

export interface FileMetadata {
  author: string;
  updatedOn: string;
}

export interface PreviewStyleOptions {
  raw?: boolean;
}

export interface PreviewStyle {
  value: string;
  raw: boolean;
}

export interface MarkdownPluginFactoryProps {
  config: ConfigWithDefaults<MarkdownField>;
  field: MarkdownField;
  mode: 'editor' | 'preview';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MarkdownPluginFactory = (props: MarkdownPluginFactoryProps) => any;

export interface MarkdownToolbarItemsFactoryProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  imageToolbarButton: any;
}

export type MarkdownToolbarItemsFactory = (
  props: MarkdownToolbarItemsFactoryProps,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) => (string | any)[][];

export interface MarkdownEditorOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialEditType?: any;
  height?: string;
  toolbarItems?: MarkdownToolbarItemsFactory;
  plugins?: MarkdownPluginFactory[];
}

export type ShortcodeControlProps<P = {}> = P & {
  onChange: (props: P) => void;
  controlProps: WidgetControlProps<string, MarkdownField>;
};

export type ShortcodePreviewProps<P = {}> = P & {
  previewProps: WidgetPreviewProps<string, MarkdownField>;
};

export interface ShortcodeConfig<P = {}> {
  label?: string;
  openTag: string;
  closeTag: string;
  separator: string;
  toProps?: (args: string[]) => P;
  toArgs?: (props: P) => string[];
  control: ComponentType<ShortcodeControlProps>;
  preview: ComponentType<ShortcodePreviewProps>;
}

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export interface InferredField {
  type: string;
  secondaryTypes: string[];
  synonyms: string[];
  defaultPreview: (value: string | boolean | number) => JSX.Element | ReactNode;
  fallbackToFirstField: boolean;
  showError: boolean;
}

export interface SvgProps {
  className: string;
}

export interface Breadcrumb {
  name?: string;
  to?: string;
  editor?: boolean;
}

export interface MediaLibraryDisplayURL {
  url?: string;
  isFetching: boolean;
  err?: unknown;
}

export interface MediaLibrarInsertOptions {
  showAlt?: boolean;
  chooseUrl?: boolean;
}

export interface BackupEntry {
  raw: string;
  path: string;
  mediaFiles: MediaFile[];
  i18n?: Record<string, { raw: string }>;
}

export interface CollectionEntryData {
  collection: CollectionWithDefaults;
  imageFieldName: string | null | undefined;
  descriptionFieldName: string | null | undefined;
  dateFieldName: string | null | undefined;
  dateFormats: DateTimeFormats | undefined;
  viewStyle: ViewStyle;
  entry: Entry;
  key: string;
  collectionLabel?: string;
}

export interface DateTimeFormats {
  storageFormat: string;
  dateFormat: string | boolean;
  timeFormat: string | boolean;
  displayFormat: string;
  timezoneExtra: string;
}

/**
 * Editorial Workflow
 */
export interface UnpublishedEntry {
  pullRequestAuthor?: string;
  slug: string;
  collection: string;
  status: WorkflowStatus;
  diffs: UnpublishedEntryDiff[];
  updatedAt: string;
  openAuthoring: boolean;
}

export interface UnpublishedEntryDiff {
  id: string;
  path: string;
  newFile: boolean;
}

export interface UnpublishedEntryMediaFile {
  id: string;
  path: string;
}
