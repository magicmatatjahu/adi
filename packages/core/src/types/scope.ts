import { ADI_SCOPE_DEF } from '../private';

import type { Scope } from '../scopes'
import type { InjectionAnnotations } from './injection'
import type { InjectionHook } from './hook'
import type { ClassType } from './types'

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
    provider: ClassType<Scope<O>>;
    hooks: InjectionHook[]
    annotations: InjectionAnnotations
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
    scope: ClassType<Scope<O>>;
    hooks: InjectionHook | InjectionHook[]
    annotations?: InjectionAnnotations
    options?: O;
  };