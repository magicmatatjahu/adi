import { ADI, installADI } from './adi';
import { Context, EventEmitter, Injector, Session, injectableMixin } from './injector';
import { Hook } from './hooks';
import { patchPromise } from './utils/wait';

function patchCircularRefs() {
  injectableMixin(Context, undefined, { 
    provideIn: 'any',
    hooks: [
      Hook(session => {
        session.setFlag('side-effect');
        const parent = session.parent;
        if (parent) {
          return parent.context.instance?.context;
        }
        return session.context.instance?.context;
      }),
    ] 
  });

  injectableMixin(Session, undefined, { 
    provideIn: 'any',
    hooks: [
      Hook(session => {
        session.setFlag('side-effect');
        return session.parent || session;
      }),
    ] 
  });

  injectableMixin(EventEmitter, [Injector], { 
    provideIn: 'any',
  });
}

function initADI() {
  // create core Injector
  const coreInjector = Injector.create(undefined, { name: 'adi:core-injector', importing: false, exporting: false }, null);
  // override parent to null
  (coreInjector as any).parent = null;
  // override scopes of core injector to only ADI reference
  coreInjector.options.scopes = [ADI];
  // install ADI to global object
  installADI(coreInjector);
}

patchPromise();
patchCircularRefs();
initADI();

export * from './decorators';
export { Hook, All, Catch, Ctx, Destroyable, Named, New, OnDestroyHook, OnInitHook, Optional, Ref, Scoped, Skip, Tagged, Token } from './hooks';
export { Context, Injector, Session, injectableMixin, moduleMixin, inject, injectMethod, createCustomResolver } from './injector';
export { Scope, DefaultScope, SingletonScope, TransientScope, createScope } from './scopes';
export { InjectionToken, ModuleToken, token, argument } from './tokens';
export { ref, resolveRef, wait, waitCallback, waitSequence, waitAll } from './utils';
export { ADI } from './adi';
export { MODULE_REF, INITIALIZERS, INJECTOR_CONFIG } from './constants';
export { when } from './constraints';

export type { DestroyableType, OnInitHookOptions, OnDestroyHookOptions } from './hooks';
export type { DefaultScopeOptions, SingletonScopeOptions, TransientScopeOptions } from './scopes';
export * from './types';
