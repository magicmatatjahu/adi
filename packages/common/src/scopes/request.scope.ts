import { Context, createScope, TransientScope } from '@adi/core';
import { DynamicScope } from './dynamic.scope';

import type { Session, ProviderInstance, DestroyContext } from '@adi/core';

export interface RequestScopeOptions {
  reuseContext?: boolean;
  canBeOverrided?: boolean;
}

export class RequestScope extends DynamicScope<RequestScopeOptions> {
  override get name(): string {
    return "adi:scope:request";
  }

  override getContext(session: Session, options: RequestScopeOptions): Context {
    return;
    // let context = this.getDynamicContext(session);
    // if (context) {
    //   return context;
    // }
  }

  override shouldDestroy(instance: ProviderInstance, options: RequestScopeOptions, destroyCtx: DestroyContext): boolean {
    return false;
  };

  override canBeOverrided(session: Session<any>, options: RequestScopeOptions): boolean {
    return options.canBeOverrided;
  }
}

export default createScope<RequestScopeOptions>(new RequestScope(), { reuseContext: true, canBeOverrided: true });
