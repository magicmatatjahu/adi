import { Injector, wait } from "@adi/core";
import { inject, Injector as AngularInjector, DestroyRef } from "@angular/core";
import { isPromiseLike } from "@adi/core/lib/utils";

import { ADI_MODULE, ADI_IMPORT, ADI_EXPORT, ADI_PROVIDERS, ADI_INJECTOR, ANGULAR_INJECTOR } from "../tokens";

import type { ModuleMetadata, ExtendedModule, InjectorInput, InjectorOptions } from "@adi/core";
import type { AdiModule, AdiImport, AdiProviders, AdiExport } from "../tokens";

export type CreateInjectorContext = {
  parent: Injector | undefined;
  angularInjector: AngularInjector;
  destroyRef: DestroyRef;
  skipInputs?: boolean;
  resaveInjector?: boolean
}

export function createInjector(
  ctx: CreateInjectorContext,
  input?: InjectorInput | Injector,
  options?: InjectorOptions,
  provides?: AdiModule[],
): Injector | Promise<Injector> {
  const { parent, angularInjector, destroyRef, skipInputs, resaveInjector = false } = ctx;

  const canExport = parent !== undefined;
  const metadata = getInputsForInjector(provides, angularInjector, skipInputs)
  
  let injector: Injector | Promise<Injector>
  if (!input) {
    injector = Injector.create(metadata || [], parent);
  } else if (input instanceof Injector) {
    injector = input;
  } else {
    injector = Injector.create({ extends: input, ...metadata } as ExtendedModule, { ...options || {}, exporting: canExport }, parent);
  }

  // destroying injector
  destroyRef.onDestroy(() => {
    wait(injector, inj => inj.destroy());
  });

  injector = injector.init();
  if (isPromiseLike(injector)) {
    resolveAsyncInjector(injector, angularInjector)
    return injector;
  }

  if (resaveInjector) {
    reassignInjector(injector, angularInjector)
  }

  return injector;
}

async function resolveAsyncInjector(injector: Promise<Injector>, angularInjector: AngularInjector): Promise<void> {
  const resolved = await injector;
  reassignInjector(resolved, angularInjector)
}

function reassignInjector(injector: Injector, angularInjector: AngularInjector) {
  const records = (angularInjector as any).records
  records.set(Injector, { factory: undefined, value: injector, multi: undefined })
  records.set(ADI_INJECTOR, { factory: undefined, value: injector, multi: undefined })
}

function getInputsForInjector(provides: AdiModule[] = [], angularInjector: AngularInjector, skipInputs: boolean = false): ModuleMetadata {
  const metadata: ModuleMetadata = {
    imports: [],
    providers: [
      {
        provide: AngularInjector,
        useValue: angularInjector,
      },
      {
        provide: ANGULAR_INJECTOR,
        useExisting: AngularInjector,
      },
    ],
    exports: []
  }

  if (skipInputs) {
    return metadata;
  }

  const modules = getModules();
  const imports = getImports();
  const providers = getProviders();
  const exports = getExports();

  const shouldProcess = Boolean(modules.length || imports.length || providers.length || exports.length);
  if (shouldProcess === false) {
    return metadata;
  }

  const items = [
    ...[...provides, ...modules].map((m: any) => ({ type: 'module', item: m.module || m, order: m.order || 0 })),
    ...imports.map((i: any) => ({ type: 'import', item: i.import || i, order: i.order || 0 })),
    ...providers.map((p: any) => ({ type: 'providers', item: p.providers || p, order: p.order || 0 })),
    ...exports.map((e: any) => ({ type: 'export', item: e.export || e, order: e.order || 0 })),
  ].sort((input1, input2) => input1.order - input2.order)

  items.forEach(({ type, item }) => {
    switch (type) {
      case 'module': {
        const { imports, providers, exports } = item;
        metadata.imports?.push(...imports || []);
        metadata.providers?.push(...providers || []);
        metadata.exports?.push(...exports || []);
        return;
      }
      case 'import': {
        metadata.imports?.push(item);
        return;
      }
      case 'providers': {
        metadata.providers?.push(...item);
        return;
      }
      case 'export': {
        metadata.exports?.push(item);
        return;
      }
    }

  })

  return metadata;
}

function getModules() {
  return inject<Array<AdiModule>>(ADI_MODULE, { self: true, optional: true }) || [];
}

function getImports() {
  return inject<Array<AdiImport>>(ADI_IMPORT, { self: true, optional: true }) || [];
}

function getProviders() {
  return inject<Array<AdiProviders>>(ADI_PROVIDERS, { self: true, optional: true }) || [];
}

function getExports() {
  return inject<Array<AdiExport>>(ADI_EXPORT, { self: true, optional: true }) || [];
}
