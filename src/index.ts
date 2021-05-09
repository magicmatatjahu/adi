import { Context } from "./injector";
import { Scope } from "./scope";

// fix circular references between Scope and Context;
Context.$$prov.scope = Scope.INSTANCE;

export { constraint, c } from "./constraint";
export * from "./constants";
export * from "./decorators";
export * from "./injector";
export * from "./interfaces";
export * from "./scope";
export * from "./wrappers";