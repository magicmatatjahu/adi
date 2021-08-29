import { createInjector, Injector } from "../injector";
import { InjectionArgument, Provider, WrapperDef } from "../interfaces";
import { Token as TokenWrapper } from "./token";
import { Token } from "../types";
import { createWrapper, Wrapper } from "../utils/wrappers";

function withInjector(injector: Injector): WrapperDef {
  return (_, session, next) => {
    return next(injector, session);
  }
}

export const WithInjector = createWrapper<Injector, true>(withInjector);

function dynamicInjection(injector: Injector) {
  return function dynamic(arg: InjectionArgument): Token | Wrapper {
    return TokenWrapper(arg.token, WithInjector(injector, arg.wrapper));
  }
}

function wrapper(providers: Provider[]): WrapperDef {
  return (parentInjector, session, next) => {
    const injector = createInjector(providers, parentInjector);
    session.options.injections = {
      dynamic: dynamicInjection(injector), 
    };
    return next(injector, session);
  }
}

export const Facade = createWrapper<Provider[], true>(wrapper);
