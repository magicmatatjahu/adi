import { InjectorMetadata, InjectorResolver } from "../injector";
import { InjectionArgument, Type, WrapperDef } from "../interfaces";
import { Token } from "../types";
import { NULL_REF } from "../constants";
import { createWrapper, Wrapper } from "../utils/wrappers";

/**
 * DELEGATE
 */
function delegateWrapper(): WrapperDef {
  return (injector, session, next) => {
    const delegate = session.retrieveDeepMeta('$$delegate');
    // delegate isn't set
    if (delegate === NULL_REF) {
      return next(injector, session);
    }
    return delegate;
  }
}

export const Delegate = createWrapper<undefined, false>(delegateWrapper);

/**
 * DECORATE
 */
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
    newSession['$$delegate'] = decoratee;

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
