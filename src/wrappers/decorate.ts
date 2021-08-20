import { InjectorMetadata, InjectorResolver } from "../injector";
import { InjectionArgument, Type, WrapperDef } from "../interfaces";
import { Token } from "../types";
import { createWrapper, Wrapper } from "../utils/wrappers";

interface DecorateOptions {
  decorator: (...args: any[]) => any;
  inject?: Array<Token | Wrapper>;
}

function decorateWrapper(decorator: Type | DecorateOptions): WrapperDef {
  let token: Type, factory: (...args: any[]) => any, deps: InjectionArgument[];

  if (typeof (decorator as DecorateOptions).decorator === 'function') { // function based decorator
    factory = (decorator as DecorateOptions).decorator;
    deps = InjectorMetadata.convertDependencies((decorator as DecorateOptions).inject || [], factory);
  } else { // type based decorator
    token = decorator as Type;
  }

  return (injector, session, next) => {
    // copy session and resolve the value to decorate
    const newSession = session.copy();
    const decoratee = next(injector, session);

    // add delegation
    newSession['$$delegate'] = {
      type: 'single',
      values: decoratee,
    };

    // function based decorator
    if (token === undefined) {
      return factory(...InjectorResolver.injectDeps(deps, injector, newSession));
    }

    // class based decorator
    const factoryDef = InjectorMetadata.getFactoryDef(token);
    // TODO: should the wrappers from wrappers chain be running here?
    return factoryDef(injector, newSession);
  }
}

export const Decorate = createWrapper<DecorateOptions, true>(decorateWrapper);
