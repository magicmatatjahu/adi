import { EMPTY_ARRAY } from "../constants";
import { InjectorMetadata, InjectorResolver } from "../injector";
import { FactoryDef, InjectionItem, Type, WrapperDef } from "../interfaces";
import { Token } from "../types";
import { createWrapper, thenable } from "../utils";

interface DecorateOptions {
  decorator: (...args: any[]) => any;
  inject?: Array<InjectionItem>;
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
        // if it has been decorated before, return value.
        if (session.instance?.status & 1024) {
          return decoratee;
        }

        // add delegation
        forkedSession['$$delegate'] = {
          type: 'single',
          values: decoratee,
        };

        // resolve decorator and save decorated value to the instance value
        return thenable(
          () => factory(injector, forkedSession),
          value => {
            session.instance.value = value;
            return value;
          }
        )
      }
    );
  }
}

export const Decorate = createWrapper<DecorateOptions, true>(decorateWrapper);
