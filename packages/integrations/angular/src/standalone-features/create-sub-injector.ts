import { Injector, wait } from "@adi/core";
import { Injector as AngularInjector, DestroyRef } from "@angular/core";
import { isPromiseLike } from "@adi/core/lib/utils";

import { ANGULAR_INJECTOR, InternalInjectorType } from "../tokens";

import type { ModuleMetadata, ExtendedModule, InjectorInput, InjectorOptions } from "@adi/core";

export type CreateSubInjectorContext = {
  parent: Injector | undefined;
  angularInjector: AngularInjector;
  destroyRef: DestroyRef;
  internalInjector: InternalInjectorType;
}

export function createSubInjector(
  ctx: CreateSubInjectorContext,
  input?: InjectorInput | Injector,
  options?: InjectorOptions,
) {
  const { parent, angularInjector, destroyRef, internalInjector } = ctx;
  const metadata = getMetadataForInjector(angularInjector)
  
  let injector: Injector | Promise<Injector>
  if (!input) {
    injector = Injector.create(metadata || [], parent);
  } else if (input instanceof Injector) {
    injector = input;
  } else {
    injector = Injector.create({ extends: input, ...metadata } as ExtendedModule, { exporting: false, ...options || {} }, parent);
  }

  // destroying injector
  destroyRef.onDestroy(() => {
    wait(injector, inj => inj.destroy());
  });

  injector = injector.init();
  if (isPromiseLike(injector)) {
    internalInjector.isAsync = true;
    internalInjector.isResolving = true;
    internalInjector.promise = wait(
      injector,
      resolved => {
        internalInjector.isAsync = false;
        internalInjector.isResolved = true;
        internalInjector.injector = resolved;
      }
    ) as Promise<void>
    
    return;
  }

  internalInjector.isResolved = true;
  internalInjector.injector = injector;
}

function getMetadataForInjector(angularInjector: AngularInjector): ModuleMetadata {
  return {
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
}
