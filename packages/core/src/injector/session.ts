import { SessionFlag } from '../enums';

import type { Injector } from './injector'; 
import type { ProviderToken, InjectionMetadata, SessionInjection, SessionContext, SessionAnnotations, InjectionAnnotations } from '../types';

const sessionFlags = {
  'resolved': SessionFlag.RESOLVED,
  'side-effect': SessionFlag.SIDE_EFFECTS,
  'dynamic': SessionFlag.DYNAMIC,
  'async': SessionFlag.ASYNC,
  'dynamic-scope': SessionFlag.DYNAMIC_SCOPE,
  'dry-run': SessionFlag.DRY_RUN,
  'parallel': SessionFlag.CIRCULAR,
  'circular': SessionFlag.PARALLEL,
}

type FlagsType = keyof typeof sessionFlags;

export class Session<T = any> {
  // TODO: Fix type for metadata argument
  static create<T>(token: ProviderToken<T> | undefined, annotations: InjectionAnnotations = {}, metadata: InjectionMetadata | undefined = {} as any, injector: Injector, parentSession?: Session): Session {
    const injections: SessionInjection = {
      inject: { token, context: undefined, scope: undefined, annotations },
      metadata,
    };
    const session = new Session(injections, { injector, provider: undefined, definition: undefined, instance: undefined }, parentSession);
    return session;
  }

  private flags: SessionFlag = SessionFlag.NONE;
  
  public result: any;
  public deep: number;
  public readonly meta: Record<string | symbol, any> = {};
  public readonly children: Array<Session> = [];

  public readonly inject = this.injection.inject;
  public readonly metadata = this.injection.metadata;

  constructor(
    public readonly injection: SessionInjection<T>,
    public readonly context: SessionContext<T>,
    public readonly parent?: Session,
    public readonly annotations: SessionAnnotations = {},
  ) {
    // possible stackoverflow
    // e.g. transient instance can have circular reference to the another transient instance which will end with infinite injection
    // TODO: Add warning, not throw error
    // if (
    //   (this.deep = parent ? parent.deep + 1 : 0) > ADI.config.stackoveflowDeep
    // ) {
    //   // console.warn()
    // }
  }

  fork(): Session {
    const { inject, metadata } = this.injection;
    const forked = new Session({ inject: { ...inject, annotations: { ...inject.annotations } }, metadata }, { ...this.context }, this.parent, { ...this.annotations });
    (forked.children as any) = [...forked.children];
    return forked;
  }

  apply(forked: Session) {
    (this.injection as any) = forked.injection;
    (this.context as any) = forked.context;
    (this.annotations as any) = forked.annotations;
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
