import { installADI } from './adi';
import { Context, EventEmitter, Injector, Session, injectableMixin } from './injector';
import { Hook } from './hooks';

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

patchCircularRefs();
installADI()

export * from './decorators';
export { ProvideIn } from './enums';
export { Hook, All, Catch, Ctx, Destroyable, Named, New, OnDestroyHook, OnInitHook, Optional, Ref, Scoped, Skip, Tagged, Token } from './hooks';
export { Context, Injector, Session, injectableMixin, moduleMixin, inject, injectMethod, createCustomResolver } from './injector';
export { Scope, DefaultScope, SingletonScope, TransientScope, createScope } from './scopes';
export { InjectionToken, ModuleToken, token, argument } from './tokens';
export { ref, resolveRef, wait, waitCallback, waitSequence, waitAll } from './utils';
export { ADI } from './adi';
export { MODULE_REF, INITIALIZERS, INJECTOR_OPTIONS } from './constants';
export { when } from './constraints';

export type { DestroyableType, OnInitHookOptions, OnDestroyHookOptions } from './hooks';
export type { DefaultScopeOptions, SingletonScopeOptions, TransientScopeOptions } from './scopes';
export * from './types';
