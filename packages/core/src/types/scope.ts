import { ADI_SCOPE_DEF } from '../private';

import type { ProviderDefinition, ProviderInstance, Session } from '../injector';
import type { Scope } from '../scopes'
import type { ClassType } from './types'
import type { ProviderToken } from './provider-token';

export type ScopeDefinition<O = any> = 
  {
    kind: 'object';
    scope: Scope<O>;
    options: O;
  } | 
  {
    kind: 'instance';
    scope: Scope<O>;
    options?: O;
  } | 
  {
    kind: 'provider';
    scope: Scope<O> | undefined
    provider: ProviderToken<Scope<O>>;
    options?: O;
  }

export interface ScopeInstance<O = any> {
  (options: O): ScopeInstance<O>;
  [ADI_SCOPE_DEF]: ScopeDefinition<O>;
}

export type ScopeType<O = any> = 
  ScopeInstance<O> | 
  Scope<O> | 
  ClassType<Scope<O>> |
  {
    scope: Scope<O>;
    options?: O;
  } | 
  {
    scope: ProviderToken<Scope<O>>;
    options?: O;
  };

export type DynamicScopeContext = {
  ref: object;
  instance: ProviderInstance
  definition: ProviderDefinition
  session: Session;
}