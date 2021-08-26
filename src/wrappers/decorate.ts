import { EMPTY_ARRAY } from "../constants";
import { InjectorMetadata, InjectorResolver } from "../injector";
import { FactoryDef, Type, WrapperDef } from "../interfaces";
import { Token } from "../types";
import { createWrapper, Wrapper, thenable } from "../utils";

interface DecorateOptions {
  decorator: (...args: any[]) => any;
  inject?: Array<Token | Wrapper>;
}

function decorateWrapper(decorator: Type | DecorateOptions): WrapperDef {
  let factory: FactoryDef;

  if (typeof (decorator as DecorateOptions).decorator === 'function') { // function based decorator
    const fn = (decorator as DecorateOptions).decorator;
    factory = InjectorResolver.createFactory(fn, (decorator as DecorateOptions).inject || EMPTY_ARRAY);
  } else { // type based decorator
    factory = InjectorMetadata.getProviderDef(decorator as Token).factory;
  }

  return (injector, session, next) => {
    // copy session and resolve the value to decorate
    const forkedSession = session.fork();

    return thenable(
      () => next(injector, session),
      decoratee => {
        // add delegation
        forkedSession['$$delegate'] = {
          type: 'single',
          values: decoratee,
        };
        // resolve decorator
        return factory(injector, forkedSession);
      }
    );
  }
}

export const Decorate = createWrapper<DecorateOptions, true>(decorateWrapper);
