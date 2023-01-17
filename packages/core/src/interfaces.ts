import type { Context, Injector, Provider, Session } from './injector';
import type { InjectionKind, ProviderKind, InstanceStatus } from './enums';
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

export type ProvideOptions<T = any> = { provide: ProviderToken<T> } & SimplifiedProvider<T>;

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

export interface ExportedModule {
  from: ClassType | ForwardReference<ClassType>;
  providers?: Array<ProviderToken>;
}

export type ProviderType<T = any> = 
  | ClassTypeProvider<T>
  | ClassProvider<T>
  | FactoryProvider<T>
  | ValueProvider<T>
  | ExistingProvider<T>
  | HookProvider<T>;

export type SimplifiedProvider<T = any> = 
  | Omit<ClassProvider<T>, 'provide' | 'hooks' | 'annotations'> 
  | Omit<FactoryProvider<T>, 'provide' | 'hooks' | 'annotations'> 
  | Omit<ClassicProvider<T>, 'provide' | 'hooks' | 'annotations'> 
  | Omit<ValueProvider<T>, 'provide' | 'hooks' | 'annotations'>
  | Omit<ExistingProvider<T>, 'provide' | 'hooks' | 'annotations'>;

export interface ClassTypeProvider<T = any> extends ClassType<T> {}

// Add hooks?: InjectionHook | Array<InjectionHook>;
export interface ClassProvider<T = any> {
  provide: ProviderToken<T>;
  useClass: ClassType<T>;
  inject?: Array<InjectionItem> | Injections;
  hooks?: InjectionHook | Array<InjectionHook>;
  when?: ConstraintDefinition;
  annotations?: ProviderAnnotations;
  scope?: ScopeType;

  useFactory?: never;
  useProvider?: never;
  useValue?: never;
  useExisting?: never;
}

export interface FactoryProvider<T = any> {
  provide: ProviderToken<T>;
  useFactory: (...args: any[]) => T | Promise<T>;
  inject?: Array<InjectionItem>;
  hooks?: InjectionHook | Array<InjectionHook>;
  when?: ConstraintDefinition;
  annotations?: ProviderAnnotations;
  scope?: ScopeType;

  useClass?: never;
  useProvider?: never;
  useValue?: never;
  useExisting?: never;
}

export interface ClassicProvider<T = any> {
  provide: ProviderToken<T>;
  useProvider: AdiProvider<T> | ClassType<AdiProvider<T>> | ClassType | AbstractClassType;
  inject?: Array<InjectionItem>;
  hooks?: InjectionHook | Array<InjectionHook>;
  when?: ConstraintDefinition;
  annotations?: ProviderAnnotations;
  scope?: ScopeType;

  useClass?: never;
  useFactory?: never;
  useValue?: never;
  useExisting?: never;
}

export interface ValueProvider<T = any> {
  provide: ProviderToken<T>;
  useValue: T;
  hooks?: InjectionHook | Array<InjectionHook>;
  when?: ConstraintDefinition;
  annotations?: ProviderAnnotations;

  useClass?: never;
  useFactory?: never;
  useProvider?: never;
  useExisting?: never;
  inject?: never;
  scope?: never;
}

export interface ExistingProvider<T = any> {
  provide: ProviderToken<T>;
  useExisting: ProviderToken<any>;
  hooks?: InjectionHook | Array<InjectionHook>;
  when?: ConstraintDefinition;
  annotations?: ProviderAnnotations;

  useClass?: never;
  useFactory?: never;
  useProvider?: never;
  useValue?: never;
  inject?: never;
  scope?: never;
}

export interface HookProvider<T = any> {
  provide?: ProviderToken<T>;
  hooks: InjectionHook | Array<InjectionHook>;
  when?: ConstraintDefinition;
  annotations?: ProviderAnnotations;

  useClass?: never;
  useFactory?: never;
  useProvider?: never;
  useValue?: never;
  inject?: never;
  scope?: never;
}

export interface AdiProvider<T = any> {
  provide(): T | Promise<T>;
}

export interface ProviderAnnotations {
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

export interface ProviderDefinition<T = any> {
  provider: Provider<T>;
  original: ProviderType,
  kind: ProviderKind;
  factory: FactoryDefinition,
  scope: ScopeType;
  when: ConstraintDefinition | undefined;
  hooks: Array<InjectionHook>;
  annotations: ProviderAnnotations;
  values: Map<Context, ProviderInstance<T>>;
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
  hook: InjectionHook;
  when: ConstraintDefinition | undefined;
  annotations: ProviderAnnotations;
}

export interface InjectionHook<T = any> {
  (session: Session, next: NextInjectionHook): T | Promise<T>;
  options?: InjectionHookOptions;
  [ADI_HOOK_DEF]: true;
}

export interface InjectionHookOptions {
  name: string;
}

export type InjectionHookFn<T = any> = (session: Session, next: NextInjectionHook) => T | Promise<T>;

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
  parameters?: Array<InjectionItem>;
  properties?: Record<string | symbol, InjectionItem>;
  methods?: Record<string | symbol, Array<InjectionItem>>;
  static?: {
    properties: Record<string | symbol, InjectionItem>;
    methods: Record<string | symbol, Array<InjectionItem>>;
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
  provider?: Provider;
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
export type FactoryDefinitionFunction<T = any> = FactoryDefinition<T, { function: (...args: any[]) => T | Promise<T>, inject: Array<InjectionArgument>, arguments: Array<any> }>;

export interface InjectableOptions<T = any> {
  provide?: SimplifiedProvider<T>;
  scope?: ScopeType;
  hooks?: InjectionHook | Array<InjectionHook>;
  provideIn?: InjectorScope | Array<InjectorScope>;
  annotations?: ProviderAnnotations;
}

export interface InjectableDefinition<T = any> {
  token: ClassType<T> | AbstractClassType<T> | InjectionToken<T>;
  init: boolean;
  options: InjectableOptions;
  injections: InjectionArguments;
}

export interface ProvideDefinition {
  prototype: Record<string | symbol, ProvideOptions>;
  static: Record<string | symbol, ProvideOptions>;
}

export type InjectorInput = ClassType | ModuleToken | ModuleMetadata | Array<ProviderType> | ExtendedModule;

export type InjectorScope = 'any' | string | symbol | InjectorInput;

export interface InjectorOptions {
  scopes?: Array<InjectorScope>;
  importing?: 'enabled' | 'disabled';
  exporting?: 'enabled' | 'disabled';
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

export interface ADIEvents {
  'injection:init': {},
  'provider:init': {},
  'provider:create': {},
  'provider:destroy': {},
  'module:init': {},
  'module:create': {},
  'module:destroy': {},
}
