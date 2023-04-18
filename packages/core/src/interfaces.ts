import type { ADI } from './adi';
import type { Context, Injector, Session } from './injector';
import type { InjectionKind, ProviderKind, InstanceStatus, InjectionHookKind } from './enums';
import type { ScopeInstance } from './scopes';
import type { ADI_HOOK_DEF } from './private';
import type { InjectionToken, ModuleToken } from './tokens';

export interface ClassType<T = any> extends Function {
  new (...args: any[]): T;
}

export interface AbstractClassType<T = any> extends Function {
  prototype: T;
}

export type ProviderToken<T = any> = ClassType<T> | AbstractClassType<T> | InjectionToken<T> | string | symbol;

export interface InjectionTokenOptions<T = any> {
  provide?: SimplifiedProvider<T>;
  hooks?: InjectionHook | Array<InjectionHook>;
  provideIn?: InjectorScope | Array<InjectorScope>;
  annotations?: ProviderAnnotations;
}

export type ProvidesOptions<T = any> = { provide: ProviderToken<T> } & SimplifiedProvider<T>;

export type ModuleImportType<T = any> = 
  | ClassType
  | ModuleToken
  | ExtendedModule<T>
  | Promise<ClassType>
  | Promise<ModuleToken>
  | Promise<ExtendedModule<T>>
  | ForwardReference<ModuleImportType<T>>;

export type ModuleExportType = 
  | ProviderToken
  | ProviderType
  | ExportedProvider
  | ExportedModule
  | ClassType
  | ModuleToken
  | ExtendedModule
  | Promise<ClassType>
  | Promise<ModuleToken>
  | Promise<ExtendedModule>
  | ForwardReference<ModuleExportType>;

export interface ModuleMetadata {
  imports?: Array<ModuleImportType>;
  providers?: Array<ProviderType>;
  exports?: Array<ModuleExportType>;
}

export interface ExtendedModule<T = any> extends ModuleMetadata {
  extends: ModuleImportType<T>;
}

export interface ExportedProvider {
  export: ProviderToken;
  names: Array<string | symbol | object>;
}

export interface ExportedModule {
  from: ClassType | ForwardReference<ClassType>;
  exports?: Array<ProviderToken | ExportedProvider>;
}

export type ProviderType<T = any> = 
  | TokenProvider<T>
  | ClassTypeProvider<T>
  | ClassProvider<T>
  | FactoryProvider<T>
  | ClassFactoryProvider<T>
  | ValueProvider<T>
  | ExistingProvider<T>
  | HookProvider<T>
  | CustomProvider<T>;

export type SimplifiedProvider<T = any> = 
  | Omit<ClassProvider<T>, 'provide' | 'hooks' | 'annotations'> 
  | Omit<FactoryProvider<T>, 'provide' | 'hooks' | 'annotations'> 
  | Omit<ClassFactoryProvider<T>, 'provide' | 'hooks' | 'annotations'> 
  | Omit<ValueProvider<T>, 'provide' | 'hooks' | 'annotations'>
  | Omit<ExistingProvider<T>, 'provide' | 'hooks' | 'annotations'>
  | Omit<CustomProvider<T>, 'provide' | 'hooks' | 'annotations'>; 

export interface ClassTypeProvider<T = any> extends ClassType<T> {}

export interface TokenProvider<T = any> {
  provide: ProviderToken<T>;
  when?: ConstraintDefinition;
  annotations?: ProviderAnnotations;

  name?: never;
  hooks?: never;
  useClass?: never;
  useFactory?: never;
  useValue?: never;
  useExisting?: never;
  inject?: never;
  scope?: never;
}

export interface ClassProvider<T = any> {
  provide: ProviderToken<T>;
  useClass: ClassType<T>;
  name?: string | symbol | object;
  inject?: Array<InjectionItem | undefined> | Injections;
  hooks?: InjectionHook | Array<InjectionHook>;
  when?: ConstraintDefinition;
  annotations?: DefinitionAnnotations;
  scope?: ScopeType;

  useFactory?: never;
  useValue?: never;
  useExisting?: never;
}

export interface FactoryProvider<T = any> {
  provide: ProviderToken<T>;
  useFactory: (...args: any[]) => T | Promise<T>;
  name?: string | symbol | object;
  inject?: Array<InjectionItem>;
  hooks?: InjectionHook | Array<InjectionHook>;
  when?: ConstraintDefinition;
  annotations?: DefinitionAnnotations;
  scope?: ScopeType;

  useClass?: never;
  useValue?: never;
  useExisting?: never;
}

export interface ClassFactoryProvider<T = any> {
  provide: ProviderToken<T>;
  useFactory: ClassType<Provider>;
  name?: string | symbol | object;
  inject?: Array<InjectionItem | undefined> | Injections;
  hooks?: InjectionHook | Array<InjectionHook>;
  when?: ConstraintDefinition;
  annotations?: DefinitionAnnotations;
  scope?: ScopeType;

  useClass?: never;
  useValue?: never;
  useExisting?: never;
}

export interface ValueProvider<T = any> {
  provide: ProviderToken<T>;
  useValue: T;
  name?: string | symbol | object;
  hooks?: InjectionHook | Array<InjectionHook>;
  when?: ConstraintDefinition;
  annotations?: DefinitionAnnotations;

  useClass?: never;
  useFactory?: never;
  useExisting?: never;
  inject?: never;
  scope?: never;
}

export interface ExistingProvider<T = any> {
  provide: ProviderToken<T>;
  useExisting: ProviderToken<any>;
  name?: string | symbol | object;
  hooks?: InjectionHook | Array<InjectionHook>;
  when?: ConstraintDefinition;
  annotations?: DefinitionAnnotations;

  useClass?: never;
  useFactory?: never;
  useValue?: never;
  inject?: never;
  scope?: never;
}

export interface CustomProvider<T = any> {
  provide?: ProviderToken<T>;
  name?: string | symbol | object;
  hooks?: InjectionHook | Array<InjectionHook>;
  when?: ConstraintDefinition;
  annotations?: DefinitionAnnotations;

  useClass?: never;
  useFactory?: never;
  useValue?: never;
  useExisting?: never;
}

export interface HookProvider<T = any> {
  provide?: ProviderToken<T>;
  hooks: InjectionHook | Array<InjectionHook>;
  name?: string | symbol | object;
  when?: ConstraintDefinition;
  annotations?: HookAnnotations;

  useClass?: never;
  useFactory?: never;
  useValue?: never;
  useExisting?: never;
  inject?: never;
  scope?: never;
}

export interface Provider<T = any> {
  provide(...args: []): T | Promise<T>;
}

export interface ProviderAnnotations {
  tags?: Array<string | symbol | object>;
  visible?: 'public' | 'private';
  eager?: boolean;
  aliases?: Array<ProviderToken>;
  component?: boolean;
  [key: string | symbol]: any;
}

export interface DefinitionAnnotations {
  name?: string | symbol | object;
  tags?: Array<string | symbol | object>;
  order?: number;
  visible?: 'public' | 'private';
  eager?: boolean;
  aliases?: Array<ProviderToken>;
  config?: ProviderToken | object;
  component?: boolean;
  [key: string | symbol]: any;
}

export interface HookAnnotations {
  name?: string | symbol | object;
  order?: number;
  visible?: 'public' | 'private';
  [key: string | symbol]: any;
}

export interface ProviderRecord<T = any> {
  token: ProviderToken<T>;
  host: Injector;
  when: ConstraintDefinition | undefined;
  hooks: Array<HookRecord>;
  defs: ProviderDefinition[];
  annotations: ProviderAnnotations;
  meta: Metadata;
}

export interface ProviderDefinition<T = any> {
  provider: ProviderRecord<T>;
  original: ProviderType,
  name: string | symbol | object;
  kind: ProviderKind;
  factory: FactoryDefinition,
  scope: ScopeType;
  when: ConstraintDefinition | undefined;
  hooks: Array<InjectionHook>;
  annotations: DefinitionAnnotations;
  values: Map<Context, ProviderInstance<T>>;
  default: boolean;
  meta: Metadata;
}

export interface ProviderInstance<T = any> {
  definition: ProviderDefinition;
  context: Context,
  value: T;
  status: InstanceStatus;
  scope: ScopeType;
  session: Session;
  parents?: Set<ProviderInstance>;
  links?: Set<ProviderInstance>;
  meta: Metadata;
}

export interface HookRecord {
  kind: 'injector' | 'provider';
  hook: InjectionHook;
  when: ConstraintDefinition | undefined;
  annotations: HookAnnotations;
}

export interface InjectionHook<T = any> {
  (session: Session, next: NextInjectionHook, ctx: InjectionHookContext): T | Promise<T>;
  [ADI_HOOK_DEF]: InjectionHookOptions;
}

export interface InjectionHookContext {
  kind: InjectionHookKind;
}

export interface InjectionHookOptions {
  name: string;
}

export type InjectionHookFn<T = any> = (session: Session, next: NextInjectionHook, ctx: InjectionHookContext) => T | Promise<T>;

export type NextInjectionHook<T = any> = (session: Session) => T | Promise<T>;

export type ConstraintDefinition = (session: Session) => boolean;

export type ScopeType<O = any> = ScopeInstance<O>;
// export type ScopeType<O = any> = Scope<O> | ClassType<Scope<O>> | ScopeInstance<O>;

export type InjectionItem<T = any> = 
  | ProviderToken<T>
  | InjectionHook
  | Array<InjectionHook>
  | PlainInjectionItem<T>;

export interface PlainInjectionItem<T = any> { 
  token: ProviderToken<T>;
  hooks?: Array<InjectionHook>; 
  annotations?: InjectionAnnotations;
};

export interface Injections {
  parameters?: Array<InjectionItem | undefined>;
  properties?: Record<string | symbol, InjectionItem | undefined>;
  methods?: Record<string | symbol, Array<InjectionItem | undefined>>;
  static?: {
    properties: Record<string | symbol, InjectionItem | undefined>;
    methods: Record<string | symbol, Array<InjectionItem | undefined>>;
  }
}

export type InjectionsOverride = (arg: InjectionItem) => InjectionItem | undefined;

export interface InjectionOptions<T = any> {
  token: ProviderToken<T>;
  context: Context;
  scope: ScopeType;
  annotations: InjectionAnnotations;
}

export interface InjectionAnnotations {
  named?: string | symbol | object;
  tagged?: Array<string | symbol | object>;
  [key: string | symbol]: any;
}

export interface InjectionArgument<T = any> { 
  token: ProviderToken<T>;
  hooks?: Array<InjectionHook>; 
  metadata?: InjectionMetadata;
};

export interface InjectionArguments {
  parameters: Array<InjectionArgument>;
  properties: Record<string | symbol, InjectionArgument>;
  methods: Record<string | symbol, Array<InjectionArgument>>;
  static?: {
    properties: Record<string | symbol, InjectionArgument>;
    methods: Record<string | symbol, Array<InjectionArgument>>;
  }
}

export interface InjectionMetadata {
  kind: InjectionKind;
  target?: Object;
  key?: string | symbol;
  index?: number;
  descriptor?: PropertyDescriptor;
  function?: (...args: any[]) => any;
  static?: boolean;
  annotations?: InjectionAnnotations;
}

export interface Metadata extends Record<string | symbol, any> {}

export interface SessionInjection<T = any> {
  options: InjectionOptions<T>;
  readonly metadata: InjectionMetadata,
}

export interface SessionContext<T = any> {
  injector: Injector;
  provider?: ProviderRecord;
  definition?: ProviderDefinition<T>;
  instance?: ProviderInstance<T>;
}

export interface SessionAnnotations {
  [key: string | symbol]: any;
}

export interface FactoryDefinition<T = any, D = any> {
  resolver: FactoryResolver<T, D>;
  data: D;
}

export type FactoryResolver<R = any, D = any> = (injector: Injector, session: Session, data: D) => R | Promise<R>;

export type FactoryDefinitionClass<T = any> = FactoryDefinition<T, { class: ClassType<T>, inject: InjectionArguments }>;
export type FactoryDefinitionFactory<T = any> = FactoryDefinition<T, { factory: (...args: any[]) => T | Promise<T>, inject: Array<InjectionArgument> }>;
export type FactoryDefinitionValue<T = any> = FactoryDefinition<T, { value: T }>;

export interface InjectableOptions<T = any> {
  provide?: SimplifiedProvider<T>;
  name?: string | symbol | object;
  hooks?: InjectionHook | Array<InjectionHook>;
  scope?: ScopeType;
  provideIn?: InjectorScope | Array<InjectorScope>;
  annotations?: ProviderAnnotations;
}

export interface InjectableDefinition<T = any> {
  token: ClassType<T> | AbstractClassType<T> | InjectionToken<T>;
  init: boolean;
  options: InjectableOptions;
  injections: InjectionArguments;
}

export type InjectorInput = ClassType | ModuleToken | ModuleMetadata | Array<ProviderType> | ExtendedModule;

export type InjectorScope = 'any' | string | symbol | InjectorInput;

export interface InjectorOptions {
  name?: string;
  scopes?: Array<InjectorScope>;
  importing?: boolean;
  exporting?: boolean;
  initialize?: boolean;
}

export interface OnInit {
  onInit(): void | Promise<void>;
}

export interface OnDestroy {
  onDestroy(): void | Promise<void>;
}

export interface DestroyContext {
  event: 'default' | 'injector' | 'manually';
}

export interface ForwardReference<T = any> {
  ref: () => T;
  _$ref: Function;
};

export interface ADIPlugin {
  name: string;
  install: (adi: typeof ADI, state: { unsubscribers: Array<ADIEventUnsubscribe> }) => void;
  destroy?: (adi: typeof ADI) => void;
}

export interface OnProviderCreateEvent { 
  injector: Injector;
  original: ProviderType;
  provider?: ProviderRecord;
  definition?: ProviderDefinition;
}

export interface OnProviderDestroyEvent { 
  injector: Injector;
  definition: ProviderDefinition;
}

export interface OnInstanceCreateEvent { 
  injector: Injector;
  session: Session;
  instance: ProviderInstance;
}

export interface OnInstanceDestroyEvent { 
  injector: Injector;
  session: Session;
  instance: ProviderInstance;
}

export interface OnModuleCreateEvent { 
  injector: Injector;
  original: ModuleImportType;
}

export interface OnModuleDestroyEvent { 
  injector: Injector;
}

export interface ADIEvents {
  'provider:create': OnProviderCreateEvent,
  'provider:destroy': OnProviderDestroyEvent,
  'instance:create': OnInstanceCreateEvent,
  'instance:destroy': OnInstanceDestroyEvent,
  'module:create': OnModuleCreateEvent,
  'module:destroy': OnModuleDestroyEvent,
}

export type ADIEventKind = keyof ADIEvents;

export interface ADIEventUnsubscribe {
  unsubscribe: () => void;
}
