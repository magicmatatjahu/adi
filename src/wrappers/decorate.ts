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
    factory = InjectorMetadata.getFactoryDef(decorator as Token);
  }

  return (injector, session, next) => {
    // copy session and resolve the value to decorate
    const newSession = session.copy();
    
    return thenable(next, injector, session).then(
      decoratee => {
        // add delegation
        newSession['$$delegate'] = {
          type: 'single',
          values: decoratee,
        };
        // resolve decorator
        return factory(injector, newSession);
      }
    )
    
    // const decoratee = next(injector, session);

    // // add delegation
    // newSession['$$delegate'] = {
    //   type: 'single',
    //   values: decoratee,
    // };

    // // TODO: should the wrappers from wrappers chain be running here?
    // return factory(injector, newSession);
  }
}

export const Decorate = createWrapper<DecorateOptions, true>(decorateWrapper);
