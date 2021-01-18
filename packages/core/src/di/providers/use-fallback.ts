import { Inject, SkipSelf, Optional } from "../decorators";
import { FactoryProvider } from "../interfaces";
import { Token } from "../types";

export function useFallback(token: Token): FactoryProvider {
  return {
    provide: token,
    useFactory(value: any) {
      return value;
    },
    inject: [[Inject(token), Optional(), SkipSelf()]],
  }
}
