import { EMPTY_ARRAY } from "../constants";
import { InjectorMetadata, InjectorResolver } from "../injector";
import { FactoryDef, InjectionArgument, Type, WrapperDef } from "../interfaces";
import { Token } from "../types";
import { createWrapper, Wrapper } from "../utils/wrappers";

interface DecorateOptions {
  decorator: (...args: any[]) => any;
  inject?: Array<Token | Wrapper>;
}

function decorateWrapper(decorator: Type | DecorateOptions): WrapperDef {
  let type: 'factory' | 'class', factory: FactoryDef;

  if (typeof (decorator as DecorateOptions).decorator === 'function') { // function based decorator
    const fn = (decorator as DecorateOptions).decorator;
    type = 'factory';
    factory = InjectorResolver.createFactory(fn, (decorator as DecorateOptions).inject || EMPTY_ARRAY);
  } else { // type based decorator
    type = 'class';
    factory = InjectorMetadata.getFactoryDef(decorator as Token);
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
    if (type === 'factory') {
      return factory(injector, newSession);
    }

    // class based decorator
    // TODO: should the wrappers from wrappers chain be running here?
    return factory(injector, newSession);
  }
}

export const Decorate = createWrapper<DecorateOptions, true>(decorateWrapper);
