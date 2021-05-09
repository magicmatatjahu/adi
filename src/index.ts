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
export {
  Token, Ref, Optional, Skip, Self, SkipSelf, Scoped, New, Named, Tagged, Memo, Lazy, LazyProxy, Decorate, Multi, OnInitHook, OnDestroyHook, SideEffects,
} from "./wrappers";
export { resolveRef, createWrapper } from "./utils";
