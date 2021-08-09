import { Context, Session } from "./injector";
import { Scope } from "./scope";

// Circular references between Scope and Context
Context.$$prov.scope = Scope.INSTANCE;
Session.$$prov.scope = Scope.INSTANCE;

export { constraint, c } from "./constraint";
export { STATIC_CONTEXT, INJECTOR_SCOPE, INJECTOR_OPTIONS, MODULE_INITIALIZERS } from "./constants";
export { Component, Inject, Injectable, Module, componentMixin, injectableMixin, moduleMixin } from "./decorators";
export { Context, Session, Injector, InjectionToken, createInjector, InjectorMetadata, InjectorResolver } from "./injector";
export * from "./interfaces";
export { Scope } from "./scope";
export * from "./wrappers";
export { resolveRef, createWrapper } from "./utils";
