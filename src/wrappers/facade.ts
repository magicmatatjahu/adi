import { createInjector, Injector } from "../injector";
import { InjectionArgument, InjectionItem, Provider, WrapperDef } from "../interfaces";
import { Token as TokenWrapper } from "./token";
import { Token } from "../types";
import { createWrapper, Wrapper } from "../utils/wrappers";

interface FacadeOptions {
  providers?: Provider[];
  deep?: boolean;
} 

function withInjector(injector: Injector): WrapperDef {
  return (_, session, next) => {
    return next(injector, session);
  }
}

export const WithInjector = createWrapper<Injector, true>(withInjector);

function dynamicInjection(injector: Injector, deep: boolean) {
  return function dynamic(arg: InjectionArgument): InjectionItem {
    return deep === true
      ? Facade({ deep: true, injector } as any, TokenWrapper(arg.token, WithInjector(injector, arg.wrapper)))
      : TokenWrapper(arg.token, WithInjector(injector, arg.wrapper));
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
