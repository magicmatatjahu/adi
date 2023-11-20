import { ADI, Injector, ModuleToken, wait } from "@adi/core";
import { Injector as NgInjector } from "@angular/core";
import { isPromiseLike } from "@adi/core/lib/utils";

import { ADI_INJECTOR, NG_INJECTOR, InjectorContextType } from "../tokens";

import type { ModuleMetadata, ExtendedModule, InjectorInput, InjectorOptions } from "@adi/core";
import { hasScopedInjector } from "@adi/core/lib/injector";

export function createInjector(
  ctx: InjectorContextType,
  input?: InjectorInput | Injector,
  options?: InjectorOptions,
) {
  const { parent, destroyRef, internalInjector, input: inputProvider } = ctx;

  if (parent?.promise) {
    internalInjector.isAsync = true;
    internalInjector.isResolving = true;
    return internalInjector.promise = wait(
      parent?.promise,
      () => createInjector(ctx, input, options)
    );
  }

  const metadata = getMetadataForInjector(ctx)
  input = input || inputProvider.input || undefined;
  options = { exporting: false, ...options || {} };

  const label = options.label;
  const hasLabel = label !== undefined;
  const parentInjector = parent?.injector || ADI.core;

  let injector: Injector | Promise<Injector>;
  if (hasLabel && hasScopedInjector(parentInjector, label as string | symbol)) {
    injector = parentInjector.of(label as string | symbol)
  } else if (input instanceof Injector) {
    injector = input
  } else {
    const injectorInput = { extends: input || ModuleToken.create(), ...metadata } as ExtendedModule
    if (hasLabel) {
      injector = parentInjector.of(label, injectorInput, options)
    } else {
      injector = Injector.create(injectorInput, options, parentInjector);
    }
  }

  // destroy injector
  destroyRef.onDestroy(() => {
    wait(injector, inj => inj.destroy());
  });

  // init injector
  injector = injector.init();

  if (isPromiseLike(injector)) {
    internalInjector.isAsync = true;
    internalInjector.isResolving = true;
    internalInjector.promise = wait(
      injector,
      resolved => {
        resolveInternalInjector(ctx, resolved)
      }
    ) as Promise<void>
  } else {
    resolveInternalInjector(ctx, injector)
  }

  return injector;
}

function getMetadataForInjector(ctx: InjectorContextType): ModuleMetadata {
  const { ngInjector, modules } = ctx;

  const metadata: ModuleMetadata = {
    imports: [],
    providers: [
      {
        provide: NgInjector,
        useValue: ngInjector,
      },
      {
        provide: NG_INJECTOR,
        useExisting: NgInjector,
      },
    ],
    exports: []
  }

  modules
    .map((m: any) => ({ item: m.module || m, order: m.order || 0 }))
    .sort((module1, module2) => module1.order - module2.order)
    .forEach(m => {
      const { imports, providers, exports } = m.item;
      metadata.imports?.push(...imports || []);
      metadata.providers?.push(...providers || []);
      metadata.exports?.push(...exports || []);
    });

  return metadata;
}

function reassignInjector(injector: Injector, ctx: InjectorContextType) {
  const { ngInjector } = ctx;

  const records = (ngInjector as any).records
  if (records) {
    records.set(Injector, { factory: undefined, value: injector, multi: undefined })
    records.set(ADI_INJECTOR, { factory: undefined, value: injector, multi: undefined })
  }
}

function resolveInternalInjector(ctx: InjectorContextType, injector: Injector) {
  const { internalInjector } = ctx;
  Object.assign(internalInjector, {
    isAsync: false,
    isResolving: false,
    isResolved: true,
    promise: undefined,
    injector: injector,
  })
  reassignInjector(injector, ctx);
}