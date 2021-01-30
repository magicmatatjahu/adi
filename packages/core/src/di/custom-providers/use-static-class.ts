import { resolver } from "../injector";
import { Type, ConstraintFunction } from "../interfaces";
import { Token } from "../types";
import { resolveForwardRef } from "../utils";

export interface ConstructorProvider<T = any> {
  provide: Token<T>,
  inject?: Array<Token | Array<ParameterDecorator>>;
  when?: ConstraintFunction;
}

export interface StaticClassProvider<T = any> {
  provide: Token<T>,
  useClass: Type<T>;
  inject?: Array<Token | Array<ParameterDecorator>>;
  when?: ConstraintFunction;
}

export function useStaticClass<T>(provider: ConstructorProvider<T> | StaticClassProvider<T>) {
  const classRef = resolveForwardRef((provider as StaticClassProvider).useClass || provider.provide) as Type;
  if (Array.isArray(provider.inject)) {
    const def = this.getProviderDef(classRef, false);
    const deps = this.convertCtorDeps(provider.inject, classRef);
  }
}
