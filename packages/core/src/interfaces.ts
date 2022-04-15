import type { ADI } from './adi';
import type { ADI_HOOK_DEF } from './constants';
import type { InstanceStatus, ProviderKind, InjectionKind } from './enums';
import type { Context } from './injector/context';
import type { InjectionToken } from './injector/injection-token';
import type { Injector } from './injector/injector';
import type { Session } from './injector/session';
import type { ScopeType } from './scopes';
import type { ForwardReference } from './utils';

// COMMON
export interface ClassType<T = any> extends Function {
  new (...args: any[]): T;
}

export interface AbstractClassType<T = any> extends Function {
  prototype: T;
}

// TOKEN
export type ProviderToken<T = any> = ClassType<T> | AbstractClassType<T> | InjectionToken<T> | string | symbol;

export interface InjectionTokenOptions<T = any> {
  provide?: Omit<ClassProvider<T>, 'provide'> | Omit<FactoryProvider<T>, 'provide'> | Omit<ValueProvider<T>, 'provide'> | Omit<ExistingProvider<T>, 'provide'>;
  annotations?: ProviderAnnotations;
}

// MODULE
export interface ModuleMetadata {
  imports?: Array<ModuleImportItem>;
  providers?: Array<Provider>;
  exports?: Array<ModuleExportItem>;
}

export type ModuleID = string | symbol;

export interface DynamicModule<T = any> extends ModuleMetadata {
  module: ClassType<T>;
  id?: ModuleID;
}

export type ModuleImportItem = 
  | ClassType
  | DynamicModule
  | Promise<ClassType>
  | Promise<DynamicModule>
  | ForwardReference;

export type ModuleExportItem = 
  | ProviderToken
  | Provider
  | ExportedModule
  | DynamicModule
  | Promise<DynamicModule>
  | ForwardReference;

export type ExportedModule = {
  from: ClassType;
  id?: ModuleID;
  providers?: Array<ProviderToken>;
}

export type InjectorScope<T = any> = 'any' | string | symbol | ClassType<T>;

export interface InjectorOptions {
  adi?: ADI;
  id?: ModuleID;
  scopes?: Array<InjectorScope>;
  importing?: 'enabled' | 'disabled';
  exporting?: 'enabled' | 'disabled';
}

// PROVIDER
export type Provider<T = any> = 
  | ClassTypeProvider<T>
  | ClassProvider<T>
  | FactoryProvider<T>
  | ValueProvider<T>
  | ExistingProvider<T>
  | HookProvider<T>;

export type CustomProvider<T = any> = 
  | ClassProvider<T>
  | FactoryProvider<T>
  | ValueProvider<T>
  | ExistingProvider<T>
  | HookProvider<T>;

export interface ClassTypeProvider<T = any> extends ClassType<T> {}

export interface ClassProvider<T = any> {
  provide: ProviderToken<T>;
  useClass: ClassType<T>;
  inject?: Array<InjectionItem> | PlainInjections;
  scope?: ScopeType;
  hooks?: Array<InjectionHook>;
  when?: ConstraintDefinition;
  annotations?: ProviderAnnotations;

  useFactory?: never;
  useValue?: never;
  useExisting?: never;
  // imports?: ModuleMetadata['imports'];
  // providers?: ModuleMetadata['providers'];
}

export interface FactoryProvider<T = any> {
  provide: ProviderToken<T>;
  useFactory: (...args: any[]) => T | Promise<T>;
  inject?: Array<InjectionItem>;
  scope?: ScopeType;
  hooks?: Array<InjectionHook>;
  when?: ConstraintDefinition;
  annotations?: ProviderAnnotations;

  useClass?: never;
  useValue?: never;
  useExisting?: never;
  // imports?: ModuleMetadata['imports'];
  // providers?: ModuleMetadata['providers'];
}

export interface ValueProvider<T = any> {
  provide: ProviderToken<T>;
  useValue: T;
  hooks?: Array<InjectionHook>;
  when?: ConstraintDefinition;
  annotations?: ProviderAnnotations;

  useClass?: never;
  useFactory?: never;
  useExisting?: never;
  inject?: never;
  scope?: ScopeType;
}

export interface ExistingProvider<T = any> {
  provide: ProviderToken<T>;
  useExisting: ProviderToken<any>;
  hooks?: Array<InjectionHook>;
  when?: ConstraintDefinition;
  annotations?: ProviderAnnotations;

  useClass?: never;
  useFactory?: never;
  useValue?: never;
  inject?: never;
  scope?: ScopeType;
}

export interface HookProvider<T = any> {
  provide?: ProviderToken<T>;
  hooks: Array<InjectionHook>;
  when?: ConstraintDefinition;
  annotations?: ProviderAnnotations;

  useClass?: never;
  useFactory?: never;
  useValue?: never;
  inject?: never;
  scope?: ScopeType;
}

export interface ProviderAnnotations {
  'adi:name'?: string | symbol;
  'adi:tags'?: Array<string>;
  'adi:order'?: number;
  'adi:visible'?: 'public' | 'private';
  'adi:eager'?: boolean;
  'adi:aliases'?: Array<ProviderToken>;
  'adi:use-named'?: string | symbol;
  'adi:config'?: any;
  'adi:override'?: 'all' | 'definition';
  'adi:component'?: boolean;
  'adi:provide-in'?: InjectorScope | Array<InjectorScope>;
  'adi:export'?: boolean;
  [key: string | symbol]: any;
}

export interface ProviderRecord<T = any> {
  token: ProviderToken<T>;
  host: Injector;
  defs: Array<ProviderDefinition>;
  hooks: Array<HookRecord>;
  meta: Record<string | symbol, any>;
}

export interface ProviderDefinition<T = any> {
  record: ProviderRecord<T>;
  kind: ProviderKind;
  provider: Provider,
  factory: DefinitionFactory,
  scope: ScopeType;
  when: ConstraintDefinition | undefined;
  hooks: Array<InjectionHook>;
  annotations: ProviderAnnotations;
  values: Map<Context, ProviderInstance<T>>;
  meta: Record<string | symbol, any>;
}

export interface ProviderInstance<T = any> {
  def: ProviderDefinition;
  session: Session;
  ctx: Context,
  value: T;
  status: InstanceStatus;
  scope: ScopeType;
  children?: Set<ProviderInstance>;
  parents?: Set<ProviderInstance>;
  meta: Record<string | symbol, any>;
}

export interface HookRecord {
  hook: InjectionHook;
  when: ConstraintDefinition | undefined;
  annotations: ProviderAnnotations;
}

export interface DefinitionFactory {
  factory: FactoryDefinition;
  data: any;
}

// HOOK
export interface InjectionHook<T = any> {
  (session: Session, next: NextHook): Promise<T | undefined> | T | undefined;
  [ADI_HOOK_DEF]?: InjectionHookDefinition;
}

export interface InjectionHookDefinition {
  name: string;
}

export type NextHook<T = any> = (session: Session) => Promise<T | undefined> | T | undefined;

// INJECTION
export interface InjectionAnnotations {
  'adi:named'?: string | symbol;
  'adi:tagged'?: Array<string | symbol>;
  'adi:labelled'?: Record<string | symbol, string | symbol>;
  [key: string | symbol]: any;
}

export interface InjectionOptions<T = any> {
  token: ProviderToken<T>;
  ctx: Context;
  scope: ScopeType;
  annotations: InjectionAnnotations;
}

export interface InjectionMetadata {
  kind: InjectionKind;
  target?: Object;
  key?: string | symbol;
  index?: number;
  handler?: Function;
  annotations?: InjectionAnnotations;
}

export interface InjectionArgument<T = any> {
  token: ProviderToken<T>;
  hooks: Array<InjectionHook>; 
  metadata: InjectionMetadata;
}

export interface InjectionMethod {
  handler: Function;
  injections: Array<InjectionArgument>;
  extensions: Record<string | symbol, any>;
}

export interface InjectionArguments {
  parameters: Array<InjectionArgument>;
  properties: Record<string | symbol, InjectionArgument>;
  methods: Record<string, Array<InjectionArgument>>;
}

export type InjectionItem<T = any> = 
  ProviderToken<T> |
  Array<InjectionHook> |
  PlainInjectionItem<T>;

export interface PlainInjectionItem<T = any> { 
  token: ProviderToken<T>;
  hooks?: Array<InjectionHook>; 
  annotations?: InjectionAnnotations;
};

export interface PlainInjections {
  parameters?: Array<InjectionItem>;
  properties?: Record<string | symbol, InjectionItem>;
  methods?: Record<string, Array<InjectionItem>>;
  override?: (arg: InjectionArgument) => InjectionItem | undefined;
}

// LIFECYCLE
export interface OnInit {
  onInit(): void | Promise<void>;
}

export interface OnDestroy {
  onDestroy(): void | Promise<void>;
}

// DECORATORS
export type InjectableOptions = {
  scope?: ScopeType;
  hooks?: Array<InjectionHook>; 
  annotations?: ProviderAnnotations;
}

// DEFINITIONS
export interface InjectableDefinition<T = any> {
  token: ClassType<T> | AbstractClassType<T> | InjectionToken<T>;
  status: 'partially' | 'full';
  options: InjectableOptions;
  injections: InjectionArguments;
  meta: Record<string | symbol, any>;
}

export type FactoryDefinition<T = any> = (injector: Injector, session: Session, data: any) => Promise<T | undefined> | T | undefined;

export type ConstraintDefinition = (session: Session) => boolean;
