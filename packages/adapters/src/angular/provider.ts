import { ClassType, InjectionItem, Optional, SingletonScope } from '@adi/core';
import { Self, SkipSelf } from '@adi/common';
import { Inject, Optional as AngularOptional, Self as AngularSelf, SkipSelf as AngularSkipSelf, InjectFlags, resolveForwardRef } from '@angular/core';

import type { ClassProvider, FactoryProvider, ValueProvider, ExistingProvider, InjectionHook, PlainInjectionItem, ProviderToken } from '@adi/core';
import type { InjectOptions } from '@angular/core';

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

// TODO: Add all treeshabale providers by looking in the provider deps;

const providerField = 'ɵprov';
export function processProvider(target: Object | object): { provider: ClassProvider | FactoryProvider | ValueProvider | ExistingProvider, multi: boolean } {
  target = resolveForwardRef(target);
  const annotations = {
    angularAdapter: true,
  }

  let provider: ClassProvider | FactoryProvider | ValueProvider | ExistingProvider | undefined;
  let multi: boolean = false;

  const providerDef: AngularProviderDefinition = target[providerField] || target;
  if (providerDef) {
    const provide = providerDef.provide && resolveForwardRef(providerDef.provide);
    multi = providerDef.multi;

    if ('useFactory' in providerDef) {
      provider = {
        provide: provide || target,
        useFactory: providerDef.useFactory as () => any,
        inject: convertAngularDependency(providerDef.deps),
        scope: SingletonScope,
        annotations,
      }
    } else if ('useClass' in providerDef) {
      const inject = providerDef.deps ? convertAngularDependency(providerDef.deps) : convertCtorParameters(providerDef.useClass as ClassTypeWithMetadata),
      provider = {
        provide: provide || target,
        useClass: providerDef.useClass as ClassType,
        inject,
        scope: SingletonScope,
        annotations,
      }
    } else if ('useValue' in providerDef) {
      provider = {
        provide: provide || target,
        useValue: providerDef.useValue,
        annotations,
      }
    } else if ('useExisting' in providerDef) {
      provider = {
        provide: provide || target,
        useValue: providerDef.useExisting,
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
      annotations,
    }
  }

  return { provider, multi };
}

const optionalHook = Optional();
const selfHook = Self();
const skipSelfHook = SkipSelf();

function convertCtorParameters(target: ClassTypeWithMetadata): Array<InjectionItem> {
  const ctorParameters = (target as ClassTypeWithMetadata).ctorParameters();
  const inject: Array<InjectionItem> = [];
  ctorParameters.forEach(parameter => {
    const { type, decorators } = parameter;
    inject.push(createInjectionItem(type, decorators));
  });
  return inject;
}

function createInjectionItem(token: ProviderToken, decorators?: Array<AngularDecorator>): PlainInjectionItem {
  const hooks: Array<InjectionHook> = [];
  if (decorators) {
    decorators.forEach(decorator => {
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
