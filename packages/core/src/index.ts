import { installADI } from './adi';
installADI()

export * from './decorators';
export { ProvideIn } from './enums';
export { Hook, All, Catch, Ctx, Destroyable, Named, New, OnDestroyHook, OnInitHook, Optional, Ref, Scoped, Skip, Tagged, Token } from './hooks';
export { Context, Injector, Session, injectableMixin, moduleMixin, inject, injectMethod, createCustomResolver, destroy } from './injector';
export { Scope, DefaultScope, SingletonScope, TransientScope, createScope } from './scopes';
export { InjectionToken, ModuleToken, token, argument } from './tokens';
export { ref, resolveRef, wait, waitCallback, waitSequence, waitAll } from './utils';
export { ADI } from './adi';
export { INJECTABLE_DEF, MODULE_DEF, MODULE_REF, INITIALIZERS, INJECTOR_OPTIONS } from './constants';
export { when } from './constraints';

export type { DestroyableType, OnInitHookOptions, OnDestroyHookOptions } from './hooks';
export type { DefaultScopeOptions, SingletonScopeOptions, TransientScopeOptions } from './scopes';
export * from './types';
