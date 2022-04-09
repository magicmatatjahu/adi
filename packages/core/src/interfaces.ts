import type { ADI_HOOK_DEF } from './constants';
import type { InstanceStatus, ProviderKind, InjectionKind } from './enums';
import type { Context } from './injector/context';
import type { InjectionToken } from './injector/injection-token';
import type { Injector } from './injector/injector';
import type { Session } from './injector/session';
import type { ScopeType } from './scopes';

// COMMON
export interface ClassType<T = any> extends Function {
  new (...args: any[]): T;
}

export interface AbstractClassType<T = any> extends Function {
  prototype: T;
}

export interface Annotations {
  [key: string | symbol]: any;
}

// TOKEN
export type ProviderToken<T = any> = ClassType<T> | AbstractClassType<T> | InjectionToken<T> | string | symbol;

export interface InjectionTokenOptions<T> {

}

// MODULE
export interface ModuleMetadata {
  imports?: Array<ModuleImportItem>;
  providers?: Array<Provider>;
  exports?: Array<ModuleExportItem>;
}

export interface DynamicModule<T = any> extends ModuleMetadata {
  module: ClassType<T>;
  // id?: ModuleID;
}

export type ModuleImportItem = 
  | ProviderToken
  | DynamicModule
  | Promise<ClassType | DynamicModule>
  | Promise<ProviderToken>
  // | ForwardRef;

export type ModuleExportItem = 
  | ProviderToken
  | Provider
  // | ExportedModule
  | DynamicModule
  | Promise<DynamicModule>
  // | ForwardRef;

export interface InjectorOptions {}

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
  annotations?: Annotations;

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
  annotations?: Annotations;

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
  annotations?: Annotations;

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
  annotations?: Annotations;

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
  annotations?: Annotations;

  useClass?: never;
  useFactory?: never;
  useValue?: never;
  inject?: never;
  scope?: ScopeType;
}

export interface ProviderRecord<T = any> {
  token: ProviderToken<T>;
  host: Injector;
  defs: Array<ProviderDefinition>;
  hooks: Array<HookRecord>;
}

export interface ProviderDefinition<T = any> {
  kind: ProviderKind;
  provider: Provider,
  record: ProviderRecord<T>;
  factory: DefinitionFactory,
  scope: ScopeType;
  when: ConstraintDefinition | undefined;
  hooks: Array<InjectionHook>;
  annotations: Annotations;
  values: Map<Context, ProviderInstance<T>>;
  meta: Record<string | symbol, any>;
}

export interface ProviderInstance<T = any> {
  def: ProviderDefinition;
  ctx: Context,
  value: T;
  scope: ScopeType;
  status: InstanceStatus;
  meta: Record<string | symbol, any>;
  // // for pararell resolution
  // donePromise?: Promise<T>;
  // doneResolve?: (value: T) => void;
  // // what is injected to instance
  // children?: Set<InstanceRecord>;
  // // where instance is injected
  // parents?: Set<InstanceRecord>;
}

export interface HookRecord {
  hook: InjectionHook;
  when: ConstraintDefinition | undefined;
  annotations: Annotations;
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
export interface InjectionOptions<T = any> {
  token: ProviderToken<T>;
  ctx: Context;
  scope: ScopeType;
  annotations: Annotations;
  meta: Record<string | symbol, any>;
}

export interface InjectionMetadata {
  kind: InjectionKind;
  target?: Object;
  key?: string | symbol;
  index?: number;
  handler?: Function;
  annotations?: Annotations;
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
  annotations?: Annotations;
};

export interface PlainInjections {
  parameters?: Array<InjectionItem>;
  properties?: Record<string | symbol, InjectionItem>;
  methods?: Record<string, Array<InjectionItem>>;
  override?: (arg: InjectionArgument) => InjectionItem | undefined;
}

// DECORATORS
export type InjectableOptions = {
  // provideIn?: ProvideInType | ProvideInType[];
  scope?: ScopeType;
  hooks?: Array<InjectionHook>; 
  annotations?: Annotations;
}

// DEFINITIONS
export interface InjectableDefinition<T = any> {
  token: ClassType<T> | AbstractClassType<T> | InjectionToken<T>;
  options: InjectableOptions;
  injections: InjectionArguments;
  meta: Record<string | symbol, any>;
}

export type FactoryDefinition<T = any> = (injector: Injector, session: Session, data: any) => Promise<T | undefined> | T | undefined;

export type ConstraintDefinition = (session: Session) => boolean;
