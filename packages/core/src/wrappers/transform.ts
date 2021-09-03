import { InjectorResolver } from "../injector";
import { InjectionItem, WrapperDef } from "../interfaces";
import { createWrapper, thenable } from "../utils";

interface TransformOptions {
  transform: (...args: any[]) => any | Promise<any>;
  inject?: Array<InjectionItem>;
}

function wrapper(transform: TransformOptions): WrapperDef {
  const factory = InjectorResolver.createFactory(transform.transform, transform.inject || []);

  return (injector, session, next) => {
    // copy session
    const forkedSession = session.fork();

    return thenable(
      () => next(injector, session),
      value => {
        // add delegation
        forkedSession['$$delegate'] = {
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
