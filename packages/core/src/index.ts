import { Scope } from "./scope";

import { DefaultScope } from "./scope/default";
import { SingletonScope } from "./scope/singleton";
import { TransientScope } from "./scope/transient";
import { InstanceScope } from "./scope/instance";
import { LocalScope } from "./scope/local";
import { ResolutionScope } from "./scope/resolution";

Scope.DEFAULT = new DefaultScope();
Scope.SINGLETON = new SingletonScope();
Scope.TRANSIENT = new TransientScope();
Scope.INSTANCE = new InstanceScope();
Scope.LOCAL = new LocalScope();
Scope.RESOLUTION = new ResolutionScope();

export { when } from "./constraint";
export { STATIC_CONTEXT, INJECTOR_OPTIONS, MODULE_INITIALIZERS, ANNOTATIONS } from "./constants";
export { Inject, Injectable, Module, UseMiddlewares, UseInterceptors, UseGuards, UseErrorHandlers, UsePipes, createParamDecorator, injectableMixin, moduleMixin } from "./decorators";
export { Context, Session, Injector, ProtoInjector, InjectionToken, InjectorMetadata, InjectorResolver, DestroyManager, ExecutionContext, ExecutionContextHost } from "./injector";
export * from "./interfaces";
export * from "./wrappers";
export { Scope } from "./scope";
export { Wrapper, createWrapper, resolveRef, ref } from "./utils";
