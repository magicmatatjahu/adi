import type { Scope } from '../scopes'
import type { ClassType } from './types'

export interface ScopeInstance<O> {
  (options: O): ScopeInstance<O>;
  kind: Scope<O>;
  options: O;
}

export type ScopeType<O = any> = Scope<O> | ClassType<Scope<O>> | ScopeInstance<O>;