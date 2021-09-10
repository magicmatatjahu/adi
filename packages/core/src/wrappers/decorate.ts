import { InjectorMetadata, InjectorResolver } from "../injector";
import { FactoryDef, InjectionItem, Type, WrapperDef } from "../interfaces";
import { Token } from "../types";
import { createWrapper, thenable } from "../utils";
import { DELEGATION } from "../constants";
import { Delegate } from "./delegate";

interface DecorateOptions {
  decorator: (...args: any[]) => any;
  inject?: Array<InjectionItem>;
}

let DECORATOR_ID = 0;
function generateID() {
  if (DECORATOR_ID === 999999) {
    DECORATOR_ID = 0;
  }
  const date = new Date();
  return `$$decorator${DECORATOR_ID++}${date.getMinutes()}${date.getSeconds()}${date.getMilliseconds()}`; 
}

function wrapper(decorator: Type | DecorateOptions): WrapperDef {
  // decoratorID is added to the every instances with `true` value to avoid redecorate the given instance
  let decoratorID = generateID();
  let factory: FactoryDef;

  if (typeof (decorator as DecorateOptions).decorator === 'function') { // function based decorator
    factory = InjectorResolver.createFactory((decorator as DecorateOptions).decorator, (decorator as DecorateOptions).inject || [Delegate()]);
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
        if (session.instance[decoratorID] === true) {
          return decoratee;
        }

        // add delegation
        forkedSession[DELEGATION.KEY] = {
          type: 'single',
          values: decoratee,
        };

        // resolve decorator and save decorated value to the instance value
        return thenable(
          () => factory(injector, forkedSession),
          value => {
            session.instance.value = value;
            session.instance[decoratorID] = true;
            return value;
          }
        )
      }
    );
  }
}

export const Decorate = createWrapper<DecorateOptions, true>(wrapper);
