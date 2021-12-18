import { InjectorMetadata, InjectorResolver } from "../injector";
import { FactoryDef, Type, FunctionInjections } from "../interfaces";
import { createWrapper, thenable } from "../utils";
import { DELEGATION } from "../constants";
import { SessionStatus } from "../enums";

export type DecorateOptions = 
  | Type
  | DecorateClass
  | DecorateFunction;

interface DecorateClass {
  useClass: Type;
  delegationKey: string | symbol | number;
}

interface DecorateFunction extends FunctionInjections {
  decorate: (...args: any[]) => any;
}

function isDecorateClass(decorator: unknown): decorator is DecorateClass {
  return !!(decorator as DecorateClass).useClass;
}

function isDecorateFunction(decorator: unknown): decorator is DecorateFunction {
  return typeof (decorator as DecorateFunction).decorate === 'function';
}

const maxInt = 2147483647
let nextReqId = 0
function generateID() {
  nextReqId = (nextReqId + 1) & maxInt
  return `$$decorator-${nextReqId.toString(36)}`
}

export const Decorate = createWrapper((decoratorOrOptions: DecorateOptions) => {
  // decoratorID is added to the every instances with `true` value to avoid redecorate the given instance
  let decoratorID = generateID();
  let factory: FactoryDef;
  let delegationKey: any;

  if (isDecorateFunction(decoratorOrOptions)) { // function based decorator
    factory = InjectorResolver.createFunction(decoratorOrOptions.decorate, decoratorOrOptions, true);
    delegationKey = decoratorOrOptions.delegationKey;
  } else if (isDecorateClass(decoratorOrOptions)) { // type based decorator with `useClass` property
    factory = InjectorMetadata.getProviderDef(decoratorOrOptions.useClass).factory;
    delegationKey = decoratorOrOptions.delegationKey;
  } else { // type based decorator
    factory = InjectorMetadata.getProviderDef(decoratorOrOptions).factory;
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
        if (session.instance.meta[decoratorID] === true) {
          return decoratee;
        }

        // add delegation
        forkedSession.meta[DELEGATION.KEY] = {
          [delegationKey || DELEGATION.DEFAULT]: decoratee,
        }

        // resolve decorator and save decorated value to the instance value
        return thenable(
          () => factory(forkedSession.injector, forkedSession),
          value => {
            if (session.instance.meta[decoratorID] === true) {
              return value;
            }
            session.instance.value = value;
            session.instance.meta[decoratorID] = true;
            return value;
          }
        )
      }
    );
  }
}, { name: "Decorate" });
