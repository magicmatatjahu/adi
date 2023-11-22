import { INJECTABLE_DEF } from '../constants';
import { SessionFlag } from '../enums';
import { Hook } from '../hooks';

import type { Injector } from './injector'; 
import type { ProviderToken, InjectionMetadata, SessionInjection, SessionContext, SessionAnnotations, InjectionAnnotations, InjectableDef } from '../types';

const sessionFlags = {
  'resolved': SessionFlag.RESOLVED,
  'side-effect': SessionFlag.SIDE_EFFECTS,
  'async': SessionFlag.ASYNC,
  'collection': SessionFlag.COLLECTION,
  'dry-run': SessionFlag.DRY_RUN,
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
  public host: Injector
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
    this.host = context.injector;
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
