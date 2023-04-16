import { SessionFlag } from '../enums';

import type { Injector } from './injector'; 
import type { ProviderToken, InjectionMetadata, SessionInjection, SessionContext, SessionAnnotations } from '../interfaces';

const sessionFlags = {
  'resolved': SessionFlag.RESOLVED,
  'side-effect': SessionFlag.SIDE_EFFECTS,
  'dry-run': SessionFlag.DRY_RUN,
  'dynamic-scope': SessionFlag.DYNAMIC_SCOPE,
  'circular': SessionFlag.CIRCULAR,
}

type FlagsType = keyof typeof sessionFlags;

export class Session<T = any> {
  static create(token: ProviderToken, metadata: InjectionMetadata, injector: Injector, parentSession?: Session): Session {
    const injections: SessionInjection = {
      options: { token, context: undefined, scope: undefined, annotations: {} },
      metadata,
    };
    const session = new Session(injections, { injector, provider: undefined, definition: undefined, instance: undefined }, parentSession);
    return session;
  }

  public result: any;
  private flags: SessionFlag = SessionFlag.NONE;
  public readonly meta: Record<string | symbol, any> = {};
  public readonly children: Array<Session> = [];

  constructor(
    public readonly injection: SessionInjection<T>,
    public readonly context: SessionContext<T>,
    public readonly parent?: Session,
    public readonly annotations: SessionAnnotations = {},
  ) {}

  get iOptions(): SessionInjection<T>['options'] {
    return this.injection.options;
  }

  get iMetadata(): SessionInjection<T>['metadata'] {
    return this.injection.metadata;
  } 

  fork(): Session {
    const { options, metadata } = this.injection;
    const forked = new Session({ options: { ...options, annotations: { ...options.annotations } }, metadata }, { ...this.context }, this.parent, { ...this.annotations });
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
