import { Scope, Token, Type } from "@adi/core";

export interface UseClassFactoryProvider<T, P> {
  provide: Token,
  useFactory: Type<T>,
  scope?: Scope,
  params?: P,
  methodName?: string,
}
