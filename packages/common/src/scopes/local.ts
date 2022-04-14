import { createScope, Scope, SessionFlag, SingletonScope, TransientScope } from '@adi/core';

import type { ProviderToken, Session, Context } from '@adi/core';
import type { ForwardReference } from '@adi/core/lib/utils';

export interface LocalScopeOptions {
  toToken?: ProviderToken | ForwardReference;
  toScope?: string | symbol;
  /**
   * 1 - nearest
   * Number.POSITIVE_INFINITY - farthest
   */
  depth?: 'nearest' | 'farthest' | number;
  reuseContext?: boolean;
  canBeOverrided?: boolean;
}

export class LocalScope extends Scope<LocalScopeOptions> {
  override get name(): string {
    return "adi:scope:local";
  }

  override getContext(session: Session, options: LocalScopeOptions): Context {
    const parent = session.parent;

    if (options.reuseContext === true && session.options.ctx) {
      return TransientScope.kind.getContext(session, options);
    } else if (!session.parent) {
      return SingletonScope.kind.getContext(session, SingletonScope.options);
    }
  }

  override canDestroy(session: Session): boolean {
    return false;
    // destroy only on `injector` event and when parents don't exist 
    // return event === 'injector' && (instance.parents === undefined || instance.parents.size === 0);
  };

  override canBeOverrided(session: Session<any>, options: LocalScopeOptions): boolean {
    return options.canBeOverrided;
  }
}

export default createScope<LocalScopeOptions>(new LocalScope(), {
  toToken: undefined,
  toScope: undefined,
  depth: 'nearest',
  reuseContext: true,
  canBeOverrided: true,
});
