// import { injectableMixin } from './injectable';
import { SessionFlag } from '../enums';
import { Hook } from '../hooks';

import type { Injector } from '../injector'; 
import type { ProviderToken, InjectionMetadata, SessionInjection, SessionContext, SessionAnnotations } from '../interfaces';

const sessionFlags = {
  'side-effect': SessionFlag.SIDE_EFFECTS,
  'dry-run': SessionFlag.DRY_RUN,
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
    parentSession && parentSession.children.push(session);
    return session;
  }

  private flags: SessionFlag = SessionFlag.NONE;
  public result: any;
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
    (forked as any).children = [...forked.children];
    return forked;
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

// injectableMixin(Session, { 
//   provideIn: 'any',
//   hooks: [
//     Hook(session => {
//       session.setFlag('side-effect');
//       return session.parent || session;
//     }),
//   ] 
// });