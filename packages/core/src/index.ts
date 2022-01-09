import { Scope } from "./scope";

import { DefaultScope } from "./scope/default";
import { SingletonScope } from "./scope/singleton";
import { TransientScope } from "./scope/transient";

Scope.DEFAULT = new DefaultScope();
Scope.SINGLETON = new SingletonScope();
Scope.TRANSIENT = new TransientScope();

export { when } from "./constraint";
export { InstanceStatus, InjectionKind, SessionStatus } from "./enums";
export { STATIC_CONTEXT, INJECTOR_OPTIONS, MODULE_INITIALIZERS, ANNOTATIONS } from "./constants";
export { Inject, Injectable, Module, UseMiddlewares, UseInterceptors, UseGuards, UseErrorHandlers, UsePipes, createParamDecorator, injectableMixin, moduleMixin } from "./decorators";
export { Context, Session, Injector, InjectionToken, ExecutionContext, ExecutionContextHost } from "./injector";
export * from "./interfaces";
export * from "./wrappers";
export { Scope } from "./scope";
export { ProxyScope } from "./scope/proxy";
export { Wrapper, createWrapper, resolveRef, ref } from "./utils";
export { Token as ProviderToken } from "./types";
