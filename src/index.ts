import { Context, Session } from "./injector";
import { Scope } from "./scope";

import { DefaultScope } from "./scope/default";
import { SingletonScope } from "./scope/singleton";
import { TransientScope } from "./scope/transient";
import { InstanceScope } from "./scope/instance";
import { LocalScope } from "./scope/local";
import { ParentScope } from "./scope/parent";

Scope.DEFAULT = new DefaultScope();
Scope.SINGLETON = new SingletonScope();
Scope.TRANSIENT = new TransientScope();
Scope.INSTANCE = new InstanceScope();
Scope.LOCAL = new LocalScope();
Scope.PARENT = new ParentScope();

// Circular references between Scope and Context
Context.$$prov.scope = Scope.INSTANCE;
Session.$$prov.scope = Scope.INSTANCE;

export { when } from "./constraint";
export { STATIC_CONTEXT, INJECTOR_SCOPE, INJECTOR_OPTIONS, MODULE_INITIALIZERS } from "./constants";
export { Component, Inject, Injectable, Module, componentMixin, injectableMixin, moduleMixin } from "./decorators";
export { Context, Session, Injector, InjectionToken, createInjector, InjectorMetadata, InjectorResolver } from "./injector";
export * from "./interfaces";
export * from "./wrappers";
export { Scope } from "./scope";
export { resolveRef, createWrapper } from "./utils";
