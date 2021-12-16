import { InjectorResolver } from "../injector";
import { InjectionItem } from "../interfaces";
import { createWrapper, thenable } from "../utils";
import { DELEGATION } from "../constants";
import { Delegate } from "./delegate";
import { SessionStatus } from "../enums";

interface TransformOptions {
  transform: (...args: any[]) => any | Promise<any>;
  inject?: Array<InjectionItem>;
}

export const Transform = createWrapper((transform: TransformOptions) => {
  const factory = InjectorResolver.createFactory(transform.transform, transform.inject || [Delegate()]);

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
}, { name: 'Transform' });
