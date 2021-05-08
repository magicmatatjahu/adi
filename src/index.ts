import { Context } from "./injector";
import { Scope } from "./scope";

// fix circular references between Scope and Context;
Context.$$prov.scope = Scope.INSTANCE;

export * from "./constants";
export * from "./decorators";
export * from "./injector";
export * from "./scope";
export * from "./wrappers";
