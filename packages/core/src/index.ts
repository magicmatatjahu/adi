import { installADI } from './adi';
installADI()

export * from './decorators';
export { ProvideIn } from './enums';
export { Hook, All, Catch, Ctx, Destroyable, Named, New, OnDestroyHook, OnInitHook, Optional, Ref, Scoped, Skip, Tagged, Token } from './hooks';
export { Context, DynamicContext, Injector, Session, injectableMixin, moduleMixin, inject, injectMethod, createCustomResolver, destroy } from './injector';
export { Scope, DefaultScope, SingletonScope, TransientScope, DynamicScope, createScope } from './scopes';
export { InjectionToken, ModuleToken, token, argument } from './tokens';
export { ref, resolveRef, wait, waitCallback, waitSequence, waitAll } from './utils';
export { ADI } from './adi';
export { INJECTABLE_DEF, MODULE_DEF, MODULE_REF, INITIALIZERS, INJECTOR_OPTIONS } from './constants';
export { when } from './constraints';

export type { DestroyableType, OnInitHookOptions, OnDestroyHookOptions } from './hooks';
export type { DefaultScopeOptions, SingletonScopeOptions, TransientScopeOptions, DynamicScopeOptions } from './scopes';
export type { ProviderRecord, ProviderDefinition, ProviderInstance } from './injector';
export * from './types';
