import { InjectorResolver } from "../injector";
import { InjectionItem, WrapperDef } from "../interfaces";
import { createNewWrapper, createWrapper, thenable } from "../utils";
import { DELEGATION } from "../constants";
import { Delegate, NewDelegate } from "./delegate";
import { SessionStatus } from "../enums";

interface TransformOptions {
  transform: (...args: any[]) => any | Promise<any>;
  inject?: Array<InjectionItem>;
}

function wrapper(transform: TransformOptions): WrapperDef {
  const factory = InjectorResolver.createFactory(transform.transform, transform.inject || [Delegate()]);

  return (injector, session, next) => {
    if (session.status & SessionStatus.DRY_RUN) {
      return next(injector, session);
    }

    // copy session
    const forkedSession = session.fork();

    return thenable(
      () => next(injector, session),
      value => {
        // mark session with side effect
        session.setSideEffect(false);
        // add delegation
        forkedSession[DELEGATION.KEY] = {
          type: 'single',
          values: value,
        };
        return thenable(
          () => factory(injector, forkedSession),
          transformedValue => transformedValue,
        );
      }
    );
  }
}

export const Transform = createWrapper<TransformOptions, true>(wrapper);

export const NewTransform = createNewWrapper((transform: TransformOptions) => {
  const factory = InjectorResolver.createFactory(transform.transform, transform.inject || [NewDelegate()]);

  return (session, next) => {
    if (session.status & SessionStatus.DRY_RUN) {
      return next(session);
    }

    // copy session
    const forkedSession = session.fork();

    return thenable(
      () => next(session),
      value => {
        // mark session with side effect
        session.setSideEffect(false);
        // add delegation
        forkedSession[DELEGATION.KEY] = {
          type: 'single',
          values: value,
        };
        return thenable(
          () => factory(forkedSession.injector, forkedSession),
          transformedValue => transformedValue,
        );
      }
    );
  }
});
