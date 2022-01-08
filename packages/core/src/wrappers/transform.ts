import { InjectorResolver } from "../injector";
import { FunctionInjections } from "../interfaces";
import { createWrapper, thenable } from "../utils";
import { DELEGATION } from "../constants";
import { SessionStatus } from "../enums";

export interface TransformOptions extends FunctionInjections {
  transform: (...args: any[]) => any | Promise<any>;
}

export const Transform = createWrapper((options: TransformOptions) => {
  const transform = InjectorResolver.createFunction(options.transform, options);

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

        // // add delegation
        // forkedSession.meta[DELEGATION.KEY] = {
        //   [options.delegationKey || DELEGATION.DEFAULT]: value,
        // }

        return thenable(
          () => transform(forkedSession.injector, forkedSession, value),
          transformedValue => transformedValue,
        );
      }
    );
  }
}, { name: 'Transform' });
