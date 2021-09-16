import { InjectorResolver } from "../injector";
import { InjectionItem, WrapperDef } from "../interfaces";
import { createWrapper, thenable } from "../utils";
import { DELEGATION } from "../constants";
import { Delegate } from "./delegate";
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
        // add delegation
        forkedSession[DELEGATION.KEY] = {
          type: 'single',
          values: value,
        };
        return thenable(
          () => factory(injector, forkedSession),
          transformedValue => transformedValue,
        )
      }
    );
  }
}

export const Transform = createWrapper<TransformOptions, true>(wrapper);
