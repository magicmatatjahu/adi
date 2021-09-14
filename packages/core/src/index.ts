import { Scope } from "./scope";

import { DefaultScope } from "./scope/default";
import { SingletonScope } from "./scope/singleton";
import { TransientScope } from "./scope/transient";
import { InstanceScope } from "./scope/instance";
import { LocalScope } from "./scope/local";

Scope.DEFAULT = new DefaultScope();
Scope.SINGLETON = new SingletonScope();
Scope.TRANSIENT = new TransientScope();
Scope.INSTANCE = new InstanceScope();
Scope.LOCAL = new LocalScope();

export { when } from "./constraint";
export { STATIC_CONTEXT, INJECTOR_SCOPE, INJECTOR_OPTIONS, MODULE_INITIALIZERS, ANNOTATIONS } from "./constants";
export { Component, Inject, Injectable, Module, componentMixin, injectableMixin, moduleMixin } from "./decorators";
export { Context, Session, Injector, InjectionToken, InjectorMetadata, InjectorResolver } from "./injector";
export * from "./interfaces";
export * from "./wrappers";
export { Scope } from "./scope";
export { Wrapper, createWrapper, resolveRef, ref } from "./utils";
