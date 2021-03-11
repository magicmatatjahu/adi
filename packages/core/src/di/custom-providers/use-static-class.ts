import { metadata, resolver } from "../injector";
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
  const clazz = provider as StaticClassProvider;
  const classRef = resolveForwardRef(clazz.useClass || clazz.provide) as Type;
  if (clazz.inject) {
    const def = metadata.getProviderDef(classRef, false);
    const deps = metadata.convertCtorDeps(clazz.inject, classRef);
  }
}



// const clazz = provider as StaticClassProvider;
// const classRef = resolveForwardRef(clazz.useClass || clazz.provide) as Type;
// if (clazz.inject) {
//   const def = this.getProviderDef(classRef, false);
//   const deps = this.convertCtorDeps(clazz.inject, classRef);
//   let factory = undefined, type = undefined;
//   if (def === undefined) {
//     factory = (injector: Injector, session?: InjectionSession, sync?: boolean) => {
//       return resolver.injectClass(classRef, deps, injector, session, sync);
//     };
//     type = ProviderType.STATIC_CLASS;
//   } else {
//     factory = resolver.providerFactory(classRef, def, deps);
//     type = ProviderType.CONSTRUCTOR;
//   }
//   return [factory, type, classRef.prototype];
// }