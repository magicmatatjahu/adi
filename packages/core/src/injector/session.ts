import { ADI_INJECTABLE_DEF } from '../constants';
import { SessionFlag } from '../enums';

import type { Injector } from './injector';
import type { InjectionOptions, InjectionMetadata, ProviderRecord, ProviderDefinition, ProviderInstance, InjectableDefinition } from '../interfaces';

export interface SessionContext<T> {
  injector: Injector;
  record?: ProviderRecord<T>;
  def?: ProviderDefinition<T>;
  instance?: ProviderInstance<T>;
}

export class Session<T = any> {
  public flags: SessionFlag = SessionFlag.SIDE_EFFECTS;

  constructor(
    public options: InjectionOptions<T>,
    public readonly ctx: SessionContext<T>,
    public readonly metadata: InjectionMetadata,
    public readonly parent?: Session,
  ) {}

  fork(): Session {
    const options: InjectionOptions = { ...this.options, annotations: { ...this.options.annotations } };
    return new Session(options, { ...this.ctx }, this.metadata, this.parent);
  }

  setFlag(flag: SessionFlag) {
    this.flags |= flag;
  }

  removeFlag(flag: SessionFlag) {
    this.flags &= ~flag;
  }

  hasFlag(flag: SessionFlag) {
    return (this.flags & flag) > 0;
  }

  static [ADI_INJECTABLE_DEF]: InjectableDefinition = {
    token: Session,
    options: {
      hooks: [(session) => {
        session.setFlag(SessionFlag.SIDE_EFFECTS);
        return session.parent;
      }],
    },
    injections: {} as any,
    meta: {},
  }
}
