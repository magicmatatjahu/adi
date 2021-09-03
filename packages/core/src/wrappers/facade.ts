import { createInjector, Injector } from "../injector";
import { InjectionArgument, InjectionItem, Provider, WrapperDef } from "../interfaces";
import { WithInjector } from "./with-injector";
import { createWrapper } from "../utils/wrappers";

interface FacadeOptions {
  providers?: Provider[];
  deep?: boolean;
} 

function dynamicInjection(injector: Injector, deep: boolean) {
  return function dynamic(arg: InjectionArgument): InjectionItem {
    const basicWrapper = WithInjector(injector, arg.wrapper);
    return deep === true
      ? { token: arg.token, wrapper: Facade({ deep: true, injector } as any, basicWrapper) }
      : { token: arg.token, wrapper: basicWrapper };
  }
}

function wrapper(providersOrOptions: Provider[] | FacadeOptions): WrapperDef {
  let providers: Provider[], deep: boolean = false, deepInjector: Injector = undefined;
  if (Array.isArray(providersOrOptions)) {
    providers = providersOrOptions;
  } else if (typeof providersOrOptions === 'object') {
    providers = providersOrOptions.providers;
    deep = providersOrOptions.deep;
    deepInjector = (providersOrOptions as any).injector;
  }
  
  return (selfInjector, session, next) => {
    let injector = deepInjector || selfInjector;
    if (providers) {
      injector = createInjector(providers, injector);
    }
    session.options.injections = {
      dynamic: dynamicInjection(injector, deep), 
    };
    return next(injector, session);
  }
}

export const Facade = createWrapper<Provider[] | FacadeOptions, true>(wrapper);
