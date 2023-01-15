import { Context, Session, injectableMixin } from './injector';
import { Hook } from './hooks';

// handle circular references
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

export * from './decorators';
export { createHook, All, Config, Ctx, Destroyable, Hook, SessionHook, Named, New, OnDestroyHook, OnInitHook, Optional, Ref, Skip, Tagged, Token } from './hooks';
export { Context, Injector, Session, injectableMixin, moduleMixin, provideMixin } from './injector';
export { Scope, DefaultScope, SingletonScope, createScope } from './scopes';
export { InjectionToken, ModuleToken } from './tokens';
export { wait, waitCallback, waitSequence } from './utils';
export { ADI } from './adi';
export { MODULE_REF, INITIALIZERS, INJECTOR_CONFIG } from './constants';
export { when } from './constraints';

export type { DestroyableType, OptionalType } from './hooks';
export type { ScopeInstance } from './scopes';
export * from './interfaces';
