import { Injector, NilInjector, ProviderRecord } from "../injector";
import { Provider, WrapperDef } from "../interfaces";
import { Token } from "../types";
import { createWrapper } from "../utils/wrappers";

function retrieveDeepRecord(token: Token, injector: Injector): ProviderRecord | undefined {
  let record: ProviderRecord = (injector as any).getRecord(token); 
  if (record !== undefined) {
    return record;
  }

  let parentInjector = injector.getParent();
  while (parentInjector !== NilInjector) {
    if (record = (parentInjector as any).getRecord(token)) {
      return record;
    }
    parentInjector = parentInjector.getParent();
  }
  return record;
}

function wrapper(providers: Provider[]): WrapperDef {
  return (injector, session) => {
    // retrieve ProviderRecord from parent injector
    const token = session.getToken();
    const deepRecord = retrieveDeepRecord(token, injector);

    // create new injector with retrieved ProviderRecord
    const newInjector = new Injector(providers, injector);
    (newInjector as any).records.set(token, deepRecord)

    return newInjector.get(token);
  }
}

export const Deps = createWrapper<Provider[], true>(wrapper);
