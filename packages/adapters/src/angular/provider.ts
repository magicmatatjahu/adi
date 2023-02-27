import { Injector as ADIInjector, All, OnInitHook, OnDestroyHook, Optional, SingletonScope, InjectionToken, INITIALIZERS, Hook } from '@adi/core';
import { Reflection } from '@adi/core/lib/utils';
import { InjectionKind } from '@adi/core/lib/enums';
import { createInjectionArgument } from '@adi/core/lib/injector';
import { Self, SkipSelf } from '@adi/common';
import { Inject, Optional as AngularOptional, Self as AngularSelf, SkipSelf as AngularSkipSelf, InjectFlags, resolveForwardRef, ENVIRONMENT_INITIALIZER, APP_INITIALIZER, Injector, INJECTOR, ɵsetCurrentInjector } from '@angular/core';

import { AngularInjector } from './injector-patch';

import type { Session, ClassType, ClassProvider, FactoryProvider, ValueProvider, ExistingProvider, InjectionHook, PlainInjectionItem, InjectionItem, ProviderToken, ProviderType, InjectionArgument } from '@adi/core';
import type { InjectOptions, OnDestroy, Provider, EnvironmentProviders, ɵInternalEnvironmentProviders } from '@angular/core';

type AngularDecorator = {
  type: any;
  args?: Array<any>;
}

type ClassTypeWithMetadata = {
  decorators: Array<AngularDecorator>,
  ctorParameters(): Array<{
    type: any | undefined,
    decorators?: Array<AngularDecorator>,
  }>
}

type AngularProviderDefinition = {
  type: ClassType;
  provide?: ProviderToken;
  providedIn?: ClassType | 'root' | 'platform' | 'any' | null;
  useClass?: unknown;
  useFactory?: unknown;
  useExisting?: unknown;
  useValue?: unknown;
  deps?: Array<AngularDependencyMetadata>;
  multi?: boolean;
}

type AngularDependencyMetadata = {
  token: ProviderToken;
  optional?: boolean;
  self?: boolean;
  skipSelf?: boolean;
}

type AngularProvider = Provider | EnvironmentProviders | ɵInternalEnvironmentProviders;
type AngularProviders = Array<AngularProvider>;

export function processProviders(providers: AngularProviders = [], collection: Map<any, any>) {
  providers.forEach(provider => {
    if (isEnvironmentProviders(provider)) {
      provider = provider.ɵproviders;
    }
    if (Array.isArray(provider)) {
      return processProviders(provider, collection);
    }

    const { provider: processed, multi } = processProvider(provider);
    const token = processed.provide;
    if (multi) {
      const multiProviders = collection.get(token);
      if (!multiProviders) {
        collection.set(token, [
          {
            provide: token,
            hooks: allHook,
            annotations: { angularAdapter: true },
          },
          processed,
        ]);
      } else if (!Array.isArray(multiProviders)) {
        throw new Error('multi mismatch');
      } else {
        multiProviders.push(processed);
      }
      return;
    }
    collection.set(token, processed);
  });
}

const providerField = 'ɵprov';
function processProvider(target: Object | object): { provider: ClassProvider | FactoryProvider | ValueProvider | ExistingProvider, multi: boolean } {
  target = resolveForwardRef(target);
  const hooks = [onDestroyHook, setInjectorHook];
  const annotations = {
    angularAdapter: true,
  }

  let provider: ClassProvider | FactoryProvider | ValueProvider | ExistingProvider | undefined;
  let multi: boolean = false;

  const providerDef: AngularProviderDefinition = target[providerField] || target;
  if (providerDef) {
    const provide = (providerDef.provide && resolveForwardRef(providerDef.provide)) || target;
    multi = providerDef.multi;

    if ('useFactory' in providerDef) {
      provider = {
        provide: provide,
        useFactory: providerDef.useFactory as () => any,
        inject: convertAngularDependency(providerDef.deps),
        scope: SingletonScope,
        hooks,
        annotations,
      }
    } else if ('useClass' in providerDef) {
      const inject = providerDef.deps ? convertAngularDependency(providerDef.deps) : convertCtorParameters(providerDef.useClass as ClassTypeWithMetadata);
      provider = {
        provide: provide,
        useClass: providerDef.useClass as ClassType,
        inject,
        scope: SingletonScope,
        hooks,
        annotations,
      }
    } else if ('useValue' in providerDef) {
      provider = {
        provide: provide,
        useValue: providerDef.useValue,
        hooks,
        annotations,
      }
    } else if ('useExisting' in providerDef) {
      provider = {
        provide: provide,
        useExisting: providerDef.useExisting,
        annotations,
      }
    }
  }

  if (!provider) {  
    provider = {
      provide: target,
      useClass: target as ClassType,
      inject: convertCtorParameters(target as ClassTypeWithMetadata),
      scope: SingletonScope,
      hooks,
      annotations,
    }
  }

  return { provider, multi };
}

export function handleTreeShakableProvider(token: any, injector: ADIInjector) {
  const hasProvider = injector.providers.get(token);
  if (hasProvider && hasProvider.self) {
    return;
  }

  const definition = token[providerField];
  let factory = definition?.factory || (() => null);
  injector.provide({
    provide: token,
    useFactory: factory,
    scope: SingletonScope,
    hooks: [onDestroyHook, setInjectorHook],
    annotations: {
      angularAdapter: true,
    }
  });
}

function convertCtorParameters(target: ClassTypeWithMetadata): Array<InjectionItem> {
  // precompiled case
  if (typeof (target as ClassTypeWithMetadata).ctorParameters === 'function') {
    const ctorParameters = (target as ClassTypeWithMetadata).ctorParameters();
    const inject: Array<InjectionItem> = [];
    ctorParameters.forEach(parameter => {
      const { type, decorators } = parameter;
      inject.push(createInjectionItem(type, decorators));
    });
    return inject;
  }

  // reflection case
  const parameTypes = Reflection.getOwnMetadata('design:paramtypes', target) || [];
  const decorators = Reflect.getOwnPropertyDescriptor(target, '__parameters__')?.value || [];
  const inject: Array<InjectionItem> = [];
  parameTypes.forEach((parameter: any, index: number) => {
    const itemDecorators = decorators[index] as Array<AngularDependencyMetadata>;
    if (!itemDecorators) {
      return inject.push(convertInjectOptions(parameter));
    }

    let token: any = parameter;
    const hooks: Array<InjectionHook> = [];
    itemDecorators.forEach(decorator => {
      if (decorator instanceof Inject) {
        token = decorator.token;
      } else if (decorator instanceof AngularOptional) {
        hooks.push(optionalHook);
      } else if (decorator instanceof AngularSelf) {
        hooks.push(selfHook);
      } else if (decorator instanceof AngularSkipSelf) {
        hooks.push(skipSelfHook);
      }
    });
    return inject.push({ token, hooks, annotations: { angularAdapter: true } });
  });
  return inject;
}

function createInjectionItem(token: ProviderToken, decorators?: Array<AngularDecorator>): PlainInjectionItem {
  const hooks: Array<InjectionHook> = [];
  if (decorators) {
    decorators.forEach(decorator => {
      console.log(decorator);
      const { type: decoratorType, args } = decorator;
      if (decoratorType instanceof Inject) {
        token = args[0];
      } else if (decoratorType instanceof AngularOptional) {
        hooks.push(optionalHook);
      } else if (decoratorType instanceof AngularSelf) {
        hooks.push(selfHook);
      } else if (decoratorType instanceof AngularSkipSelf) {
        hooks.push(skipSelfHook);
      }
    });
  }
  return { token, hooks, annotations: { angularAdapter: true } };
}

function convertAngularDependency(dependenies: Array<ProviderToken | any[] | AngularDependencyMetadata> = []): Array<PlainInjectionItem> {
  const injectionItems: PlainInjectionItem[] = [];
  dependenies.forEach(dependency => {
    const arg = resolveForwardRef(dependency);
    if (Array.isArray(arg)) {
      const length = arg.length;
      if (arg.length === 0) {
        throw new Error('Arguments array must have arguments.');
      }

      let token: ProviderToken<any> | undefined = undefined;
      const hooks: Array<InjectionHook> = []

      for (let j = 0; j < length; j++) {
        const meta = arg[j];
        const flag = getInjectFlag(meta);
        if (typeof flag === 'number') {
          // Special case with @Inject decorator.
          if (flag === -1) {
            token = meta.token;
          } else {
            convertFlagsToHooks(flag, hooks);
          }
        } else {
          token = meta;
        }
      }

      injectionItems.push({ token, hooks, annotations: { angularAdapter: true } });
    } else {
      const token = (arg as AngularDependencyMetadata).token || arg as ProviderToken;
      injectionItems.push({ token, hooks: convertObjectFlagsToHooks(arg as AngularDependencyMetadata), annotations: { angularAdapter: true }});
    }
  });
  return injectionItems;
}

export function convertInjectOptions(token: ProviderToken, flags?: InjectOptions | InjectFlags): PlainInjectionItem {
  if (flags === undefined) {
    return { token, hooks: [], annotations: { angularAdapter: true } };
  }

  if (typeof flags === 'object') {
    return { token, hooks: convertObjectFlagsToHooks(flags), annotations: { angularAdapter: true } };
  }

  return { token, hooks: convertFlagsToHooks(flags), annotations: { angularAdapter: true } };
}

function convertObjectFlagsToHooks(flags: InjectOptions, hooks: Array<InjectionHook> = []): Array<InjectionHook> {
  if (flags.optional) {
    hooks.push(optionalHook);
  }
  if (flags.self) {
    hooks.push(selfHook);
  }
  if (flags.skipSelf) {
    hooks.push(skipSelfHook);
  }
  return hooks;
}

function convertFlagsToHooks(flags: InjectFlags, hooks: Array<InjectionHook> = []): Array<InjectionHook> {
  if (flags & InjectFlags.Optional) {
    hooks.push(optionalHook);
  } else if (flags & InjectFlags.Self) {
    hooks.push(selfHook);
  } else if (flags & InjectFlags.SkipSelf) {
    hooks.push(skipSelfHook);
  }
  return hooks;
}

function getInjectFlag(token: any): number | undefined {
  return token['__NG_DI_FLAG__'];
}

export function coreProviders(): Array<ProviderType> {
  return [
    { provide: Injector, useClass: AngularInjector, inject: [ADIInjector], scope: SingletonScope, annotations: { angularAdapter: true } },
    { provide: INJECTOR as InjectionToken, useExisting: Injector, annotations: { angularAdapter: true } },
    { provide: APP_INITIALIZER as InjectionToken, hooks: [optionalHook, initializersHook], annotations: { angularAdapter: true } },
    { provide: ENVIRONMENT_INITIALIZER as InjectionToken, hooks: [optionalHook, initializersHook], annotations: { angularAdapter: true } },
    { provide: INITIALIZERS, useExisting: APP_INITIALIZER as InjectionToken, annotations: { angularAdapter: true } },
    { provide: INITIALIZERS, useExisting: ENVIRONMENT_INITIALIZER as InjectionToken, annotations: { angularAdapter: true } },
  ];
}

let currentSession: Session | undefined = undefined;
export function setCurrentSession(session: Session): Session | undefined {
  const previous = currentSession;
  currentSession = session;
  return previous;
}
export function getCurrentSession(): Session | undefined {
  return currentSession;
}

export function serializeArgument(input: unknown, flags: unknown): InjectionArgument {
  const { token, hooks, annotations } = convertInjectOptions(input, flags);
  const session = getCurrentSession();
  const argument = createInjectionArgument(token, hooks, { ...session.iMetadata, kind: InjectionKind.CUSTOM, index: undefined, key: undefined, annotations });
  argument.token = token;
  return argument;
}

/**
 * Custom hooks
 */

// Angular injects the "null" for unknown optional dependencies
const optionalHook = Optional(null);
const selfHook = Self();
const skipSelfHook = SkipSelf();
const allHook = All();

// Set current session to reuse it in the AngularInjector
const setInjectorHook = Hook((session, next) => {
  const injectorMeta = session.context.injector.meta;
  const angularInjector: AngularInjector = injectorMeta.angularInjector || (injectorMeta.angularInjector = session.context.injector.get(Injector));
  const previousInjector = ɵsetCurrentInjector(angularInjector);
  const previousSession = setCurrentSession(session);
  try {
    return next(session);
  } finally {
    ɵsetCurrentInjector(previousInjector);
    setCurrentSession(previousSession);
  }
});
// That hook will be only fired when injector will be destroyed
const onDestroyHook = OnDestroyHook(value => {
  if (value && typeof (value as OnDestroy).ngOnDestroy === 'function') {
    (value as OnDestroy).ngOnDestroy();
  }
});
const initializersHook = OnInitHook((fn: unknown) => {
  if (typeof fn === 'function') return fn();
});

function isEnvironmentProviders(provider: AngularProvider): provider is ɵInternalEnvironmentProviders {
  return provider && !!(provider as ɵInternalEnvironmentProviders).ɵproviders;
}