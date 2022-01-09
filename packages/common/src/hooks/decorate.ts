import { createWrapper, SessionStatus, FunctionDef, Type, FunctionInjections } from '@adi/core';
import { getProviderDef, createFunction } from '@adi/core/lib/injector';
import { thenable } from '@adi/core/lib/utils';

import { DELEGATION } from "../constants";

export type DecorateOptions = 
  | Type
  | DecorateClass
  | DecorateFunction;

interface DecorateClass {
  useClass: Type;
  delegationKey: string | symbol;
}

interface DecorateFunction<T = any> extends FunctionInjections {
  decorate: (decorated: T, ...args: any[]) => any;
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
  let factory: FunctionDef;
  let delegationKey: any;

  if (isDecorateFunction(decoratorOrOptions)) { // function based decorator
    factory = createFunction(decoratorOrOptions.decorate, decoratorOrOptions);
  } else if (isDecorateClass(decoratorOrOptions)) { // type based decorator with `useClass` property
    factory = getProviderDef(decoratorOrOptions.useClass).factory;
    delegationKey = decoratorOrOptions.delegationKey || 'decorated';
  } else { // type based decorator
    factory = getProviderDef(decoratorOrOptions).factory;
    delegationKey = 'decorated'
  }

  return (session, next) => {
    if (session.status & SessionStatus.DRY_RUN) {
      return next(session);
    }

    // copy session and resolve the value to decorate
    const forkedSession = session.fork();

    return thenable(
      () => next(session),
      decorated => {
        // if it has been decorated before, return value.
        if (session.instance.meta[decoratorID] === true) {
          return decorated;
        }

        // add delegation
        if (delegationKey) {
          forkedSession.meta[DELEGATION.KEY] = {
            [delegationKey]: decorated,
          }
        }

        // resolve decorator and save decorated value to the instance value
        return thenable(
          () => factory(forkedSession.injector, forkedSession, decorated),
          value => {
            // possible problem with async resolution - check again
            if (session.instance.meta[decoratorID] === true) {
              return value;
            }
            session.instance.meta[decoratorID] = true;
            session.instance.value = value;
            return value;
          }
        )
      }
    );
  }
}, { name: "Decorate" });
