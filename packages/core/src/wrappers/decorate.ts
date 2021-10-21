import { InjectorMetadata, InjectorResolver } from "../injector";
import { FactoryDef, InjectionItem, Type, WrapperDef } from "../interfaces";
import { Token } from "../types";
import { createNewWrapper, createWrapper, thenable } from "../utils";
import { DELEGATION } from "../constants";
import { Delegate, NewDelegate } from "./delegate";
import { SessionStatus } from "../enums";

// TODO: Change `decorator` to `decorate`
interface DecorateOptions {
  decorator: (...args: any[]) => any;
  inject?: Array<InjectionItem>;
}

const maxInt = 2147483647
let nextReqId = 0
function generateID() {
  nextReqId = (nextReqId + 1) & maxInt
  return `ID-${nextReqId.toString(36)}`
}

function wrapper(decorator: Type | DecorateOptions) {
  // decoratorID is added to the every instances with `true` value to avoid redecorate the given instance
  let decoratorID = generateID();
  let factory: FactoryDef;

  if (typeof (decorator as DecorateOptions).decorator === 'function') { // function based decorator
    factory = InjectorResolver.createFactory((decorator as DecorateOptions).decorator, (decorator as DecorateOptions).inject || [Delegate()]);
  } else { // type based decorator
    factory = InjectorMetadata.getProviderDef(decorator as Token).factory;
  }

  return (injector, session, next) => {
    if (session.status & SessionStatus.DRY_RUN) {
      return next(injector, session);
    }

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

interface NewDecorateOptions {
  decorate: (...args: any[]) => any;
  inject?: Array<InjectionItem>;
}

function isDecorateFunction(decorator: unknown): decorator is NewDecorateOptions {
  return typeof (decorator as NewDecorateOptions).decorate === 'function';
}

export const NewDecorate = createNewWrapper((decorator: Type | NewDecorateOptions) => {
  // decoratorID is added to the every instances with `true` value to avoid redecorate the given instance
  let decoratorID = generateID();
  let factory: FactoryDef;

  if (isDecorateFunction(decorator)) { // function based decorator
    factory = InjectorResolver.createFactory(decorator.decorate, decorator.inject || [NewDelegate()]);
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
