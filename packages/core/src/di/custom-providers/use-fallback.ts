import { Injector, resolver, metadata } from "../injector";
import { Provider, _CustomProvider, InjectionSession } from "../interfaces";

export function useFallback(provider: Provider): _CustomProvider {
  const provide = typeof provider === "function" ? provider : provider.provide; 
  return {
    provide,
    useCustom() {
      return function(injector: Injector, session?: InjectionSession, sync?: boolean) {
        const deepRecord = metadata.getDeepRecord(provide, injector);
        if (deepRecord !== undefined) {
          (injector as any).ownRecords.set(provide, deepRecord);
        } else {
          // override record by reference
          metadata.toRecord(provider, injector);
        }
        return resolver.inject(provide, session.options, injector, session.parent, sync);
      }
    },
  }
}
