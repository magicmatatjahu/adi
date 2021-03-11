import { Injector, resolver, metadata } from "../injector";
import { Provider, ExtensionProvider, InjectionSession } from "../interfaces";

export function useFallback(provider: Provider): ExtensionProvider {
  const token = typeof provider === "function" ? provider : provider.provide; 
  return {
    provide: token,
    useExtension() {
      return (injector: Injector, session?: InjectionSession, sync?: boolean) => {
        const deepRecord = metadata.getDeepRecord(token, injector);
        if (deepRecord !== undefined) {
          (injector as any).ownRecords.set(token, deepRecord);
        } else {
          // override record by reference
          metadata.toRecord(provider, injector);
        }
        return resolver.inject(token, session.options, injector, session.parent, sync);
      }
    },
  }
}
