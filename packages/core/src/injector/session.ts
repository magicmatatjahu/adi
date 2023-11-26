import { INJECTABLE_DEF } from '../constants';
import { SessionFlag } from '../enums';
import { Hook } from '../hooks';
import { createInjectionMetadata } from './metadata';

import type { Context } from './context'; 
import type { Injector } from './injector'; 
import type { ProviderRecord, ProviderDefinition, ProviderInstance } from './provider';
import type { ProviderToken, InjectionAnnotations, InjectionMetadata, InjectableDef, ScopeDefinition, SessionInput, SessionData } from '../types';

const sessionFlags = {
  'none': SessionFlag.NONE,
  'resolved': SessionFlag.RESOLVED,
  'side-effect': SessionFlag.SIDE_EFFECTS,
  'dynamic': SessionFlag.DYNAMIC,
  'async': SessionFlag.ASYNC,
  'collection': SessionFlag.COLLECTION,
  'dry-run': SessionFlag.DRY_RUN,
  'dynamic-scope': SessionFlag.DYNAMIC_SCOPE,
  'parallel': SessionFlag.PARALLEL,
  'circular': SessionFlag.CIRCULAR,
}

type FlagsType = keyof typeof sessionFlags;

export class Session<T = any> {
  static [INJECTABLE_DEF]: InjectableDef = {
    provideIn: 'any',
    hooks: [
      Hook(session => {
        session.setFlag('side-effect');
        return session.parent || session;
      }),
    ] 
  }

  static create<T>(input: SessionInput, parent?: Session): Session {
    return new Session(input, parent || undefined);
  }

  // injection data
  public token: ProviderToken<T> | undefined = undefined;
  public ctx: Context | undefined = undefined;
  public scope: ScopeDefinition | undefined = undefined;
  public annotations: InjectionAnnotations;
  public readonly metadata: InjectionMetadata;

  // injection context
  public host: Injector
  public injector: Injector
  public provider: ProviderRecord | undefined = undefined;
  public definition: ProviderDefinition | undefined = undefined;
  public instance: ProviderInstance | undefined = undefined;

  // session related data
  private flags: SessionFlag = SessionFlag.NONE;
  public readonly children: Array<Session> = [];
  public readonly data: SessionData = {};
  public dynamicCtx: object | undefined;
  public result: any;

  private constructor(
    input: SessionInput,
    public readonly parent: Session | undefined,
  ) {
    this.host = this.injector = input.injector;
    this.token = input.token;
    const metadata = this.metadata = input.metadata || { ...createInjectionMetadata() };
    this.annotations = { ...metadata.annotations || {}, ...input.annotations || {} };
    this.dynamicCtx = parent?.dynamicCtx;
  }

  fork(): Session {
    const { token, metadata, annotations, injector, parent, ...rest } = this;
    const forked = Object.assign(new Session({ token, metadata, annotations, injector }, parent), rest);
    (forked.children as any) = [...forked.children];
    return forked;
  }

  apply(forked: Session): void {
    Object.assign(this, forked);
  }

  replace(session: Session): void {
    const parent = this.parent;
    if (parent) {
      const children = parent.children;
      const indexOf = children.indexOf(this);
      if (indexOf > -1) {
        children.splice(indexOf, 1, session);
      } 
    }
  }

  setFlag(flag: FlagsType) {
    this.flags |= sessionFlags[flag];
  }

  removeFlag(flag: FlagsType) {
    this.flags &= ~sessionFlags[flag];
  }

  hasFlag(flag: FlagsType) {
    return (this.flags & sessionFlags[flag]) > 0;
  }
}
