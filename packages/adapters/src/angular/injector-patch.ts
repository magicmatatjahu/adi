import { Injector } from '@adi/core';
import { EnvironmentInjector, InjectFlags, InjectOptions, ProviderToken, ɵsetCurrentInjector } from '@angular/core';

import { convertInjectOptions } from './provider';

export class AngularInjector extends EnvironmentInjector {
  constructor(
    private injector: Injector,
  ) {
    super();
  }

  override get<T>(token: ProviderToken<T>, notFoundValue: undefined, options: InjectOptions & { optional?: false; }): T;
  override get<T>(token: ProviderToken<T>, notFoundValue: null, options: InjectOptions): T;
  override get<T>(token: ProviderToken<T>, notFoundValue?: T, options?: InjectOptions): T;
  override get<T>(token: ProviderToken<T>, notFoundValue?: T, flags?: InjectFlags): T;
  override get(token: any, notFoundValue?: any);
  override get(token: unknown, _?: unknown, flags?: unknown): any {
    const injectionArgument = convertInjectOptions(token, flags);
    const previousInjector = ɵsetCurrentInjector(this); 
    try {
      return this.injector.get(token, injectionArgument.hooks);
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
