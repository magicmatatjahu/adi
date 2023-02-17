import { ADI, installADI } from './adi';
import { Context, Injector, Session, injectableMixin } from './injector';
import { Hook } from './hooks';

function patchCircularRefs() {
  injectableMixin(Context, { 
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

  injectableMixin(Session, { 
    provideIn: 'any',
    hooks: [
      Hook(session => {
        session.setFlag('side-effect');
        return session.parent || session;
      }),
    ] 
  });
}

function initADI() {
  // create core Injector
  const coreInjector = Injector.create(undefined, { name: 'adi:core-injector', importing: 'disabled', exporting: 'disabled' });
  // override parent to null
  (coreInjector as any).parent = null;
  // override scopes of core injector to only ADI reference
  coreInjector.options.scopes = [ADI];
  // install ADI to global object
  installADI(coreInjector);
}

patchCircularRefs();
initADI();

export * from './decorators';
export { createHook, All, Ctx, Destroyable, Hook, SessionHook, Named, OnDestroyHook, OnInitHook, Optional, Ref, Tagged, Token } from './hooks';
export { Context, Injector, Session, injectableMixin, moduleMixin, createFunctionResolver } from './injector';
export { Scope, DefaultScope, SingletonScope, TransientScope, createScope } from './scopes';
export { InjectionToken, ModuleToken } from './tokens';
export { ref, resolveRef, wait, waitCallback, waitSequence, waitAll } from './utils';
export { ADI } from './adi';
export { MODULE_REF, INITIALIZERS, INJECTOR_CONFIG, STATIC_CONTEXT } from './constants';
export { when } from './constraints';

export type { DestroyableType, OptionalType, OnInitHookOptions, OnDestroyHookOptions } from './hooks';
export type { ScopeInstance, DefaultScopeOptions, SingletonScopeOptions, TransientScopeOptions } from './scopes';
export * from './interfaces';
