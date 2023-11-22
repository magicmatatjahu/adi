import type { InjectionToken } from '../tokens/injection.token'
import type { InjectionArguments, InjectionItem, Injections } from './injection'
import type { InjectorScope } from './injector'
import type { OverwriteProvider, ProviderHooks, ProviderAnnotations } from './provider'
import type { ScopeType } from './scope'
import type { InjectableStatus } from '../enums'
import type { ClassType, AbstractClassType } from './types'

export interface InjectableDef<T = any> extends InjectableOptions<T> {
  injections?: Injections | Array<InjectionItem>;
}

export interface InjectableOptions<T = any> {
  provideIn?: InjectorScope | Array<InjectorScope>;
  hooks?: ProviderHooks;
  name?: string | symbol | object;
  scope?: ScopeType;
  annotations?: ProviderAnnotations;
  provide?: OverwriteProvider<T>;
}

export interface InjectableDefinition<T = any> {
  token: ClassType<T> | AbstractClassType<T> | InjectionToken<T>;
  status: InjectableStatus;
  options: InjectableOptions;
  injections: InjectionArguments;
}
