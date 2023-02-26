import { TransientScope, DefaultScope } from "@adi/core";
import { Scope as NestScope } from "@nestjs/common";

import { reflectClassInjections, reflectScope, convertFactoryDependencies } from "./reflection";

import type { ProviderType, ScopeType } from "@adi/core";
import type { Provider, ScopeOptions } from "@nestjs/common";

export function processProvider(provider: Provider): ProviderType {
  if (typeof provider === 'function') {
    const scope = getScope(reflectScope(provider));
    return {
      provide: provider,
      useClass: provider,
      inject: reflectClassInjections(provider),
      scope,
      annotations: {
        nestAdapter: true,
        eager: scope === DefaultScope,
      },
    }
  } else if ('useFactory' in provider) {
    const scope = getScope(provider);
    return {
      provide: provider.provide,
      useFactory: provider.useFactory,
      inject: convertFactoryDependencies(provider.inject),
      scope,
      annotations: {
        nestAdapter: true,
        eager: scope === DefaultScope,
      },
    }
  } else if ('useClass' in provider) {
    const scope = provider.scope ? getScope(provider) : getScope(reflectScope(provider.useClass));
    return {
      provide: provider.provide,
      useClass: provider.useClass,
      inject: reflectClassInjections(provider.useClass),
      scope,
      annotations: {
        nestAdapter: true,
        eager: scope === DefaultScope,
      },
    }
  } else if ('useValue' in provider) {
    return {
      provide: provider.provide,
      useValue: provider.useValue,
      annotations: {
        nestAdapter: true,
      },
    }
  } else if ('useExisting' in provider) {
    return {
      provide: provider.provide,
      useExisting: provider.useExisting,
      annotations: {
        nestAdapter: true,
      },
    }
  }
}

function getScope(scope: ScopeOptions): ScopeType {
  switch (scope.scope) {
    case NestScope.TRANSIENT: return TransientScope;
    // TODO: use proper scope for request and durable
    case NestScope.REQUEST: return TransientScope;
    default: return DefaultScope;
  }
}
