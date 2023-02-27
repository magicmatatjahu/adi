import { Injector } from '@adi/core';
import { InjectorStatus } from '@adi/core/lib/enums';
import { inject } from '@adi/core/lib/injector';
import { EnvironmentInjector, ɵsetCurrentInjector } from '@angular/core';

import { serializeArgument, handleTreeShakableProvider, getCurrentSession } from './provider';

import type { ProviderToken, InjectOptions, InjectFlags } from '@angular/core';

export class AngularInjector extends EnvironmentInjector {
  constructor(
    private injector: Injector,
  ) {
    super();
  }

  // repass injection session to the down
  override get<T>(token: ProviderToken<T>, notFoundValue: undefined, options: InjectOptions & { optional?: false; }): T;
  override get<T>(token: ProviderToken<T>, notFoundValue: null, options: InjectOptions): T;
  override get<T>(token: ProviderToken<T>, notFoundValue?: T, options?: InjectOptions): T;
  override get<T>(token: ProviderToken<T>, notFoundValue?: T, flags?: InjectFlags): T;
  override get(token: any, notFoundValue?: any): any;
  override get(token: unknown, _?: unknown, flags?: unknown): any {
    const status = this.injector.status
    if (status & InjectorStatus.DESTROYED || !(status & InjectorStatus.INITIALIZED)) {
      return; 
    }

    // maybe treeshakable
    handleTreeShakableProvider(token, this.injector);
    const previousInjector = ɵsetCurrentInjector(this); 
    try {
      const argument = serializeArgument(token, flags)
      return inject(this.injector, argument, getCurrentSession());
    } finally {
      ɵsetCurrentInjector(previousInjector);
    }
  }

  override runInContext<ReturnT>(fn: () => ReturnT): ReturnT {
    const previousInjector = ɵsetCurrentInjector(this);
    try {
      return fn();
    } finally {
      ɵsetCurrentInjector(previousInjector);
    }
  }

  override destroy(): void {
    this.injector.destroy();
  }
}
