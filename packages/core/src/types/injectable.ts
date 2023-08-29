import type { InjectionToken } from '../tokens/injection.token'
import type { InjectionArguments } from './injection'
import type { InjectorScope } from './injector'
import type { SimplifiedProvider, ProviderHooks, ProviderAnnotations } from './provider'
import type { ScopeType } from './scope'
import type { ClassType, AbstractClassType } from './types'

export interface InjectableOptions<T = any> {
  provide?: SimplifiedProvider<T>;
  name?: string | symbol | object;
  hooks?: ProviderHooks;
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
