import { InjectorMetadata, InjectorResolver } from "../injector";
import { FactoryDef, InjectionItem, Type } from "../interfaces";
import { createWrapper, thenable } from "../utils";
import { DELEGATION } from "../constants";
import { Delegate } from "./delegate";
import { SessionStatus } from "../enums";

interface DecorateOptions {
  decorate: (...args: any[]) => any;
  inject?: Array<InjectionItem>;
}

function isDecorateFunction(decorator: unknown): decorator is DecorateOptions {
  return typeof (decorator as DecorateOptions).decorate === 'function';
}

const maxInt = 2147483647
let nextReqId = 0
function generateID() {
  nextReqId = (nextReqId + 1) & maxInt
  return `ID-${nextReqId.toString(36)}`
}

export const Decorate = createWrapper((decorator: Type | DecorateOptions) => {
  // decoratorID is added to the every instances with `true` value to avoid redecorate the given instance
  let decoratorID = generateID();
  let factory: FactoryDef;

  if (isDecorateFunction(decorator)) { // function based decorator
    factory = InjectorResolver.createFactory(decorator.decorate, decorator.inject || [Delegate()]);
  } else { // type based decorator
    factory = InjectorMetadata.getProviderDef(decorator).factory;
  }

  return (session, next) => {
    if (session.status & SessionStatus.DRY_RUN) {
      return next(session);
    }

    // copy session and resolve the value to decorate
    const forkedSession = session.fork();

    return thenable(
      () => next(session),
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
          () => factory(forkedSession.injector, forkedSession),
          value => {
            session.instance.value = value;
            session.instance[decoratorID] = true;
            return value;
          }
        )
      }
    );
  }
});
