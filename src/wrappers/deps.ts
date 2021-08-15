import { Injector, InjectorMetadata } from "../injector";
import { Provider, WrapperDef } from "../interfaces";
import { createWrapper } from "../utils";
import { createWrapper as cr } from "../utils/wrappers.new";

function wrapper(providers: Provider[]): WrapperDef {
  return (injector, session) => {
    // retrieve ProviderRecord from parent injector
    const token = session.getToken();
    const deepRecord = InjectorMetadata.retrieveDeepRecord(token, injector);

    // create new injector with retrieved ProviderRecord
    const newInjector = new Injector(providers, injector);
    (newInjector as any).records.set(token, deepRecord)

    return newInjector.get(token);
  }
}

export const NewDeps = cr<Provider[], true>(wrapper);
export const Deps = createWrapper(wrapper);

// @Inject(Deps([], Named()))
