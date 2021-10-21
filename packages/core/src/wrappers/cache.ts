import { SessionStatus } from "../enums";
import { Injector, Session } from "../injector";
import { InjectionMetadata, NextWrapper } from "../interfaces";
import { createWrapper, thenable } from "../utils";

const cache: WeakMap<Injector, WeakMap<InjectionMetadata, any>> = new WeakMap();

function wrapper(session: Session, next: NextWrapper) {
  const injector = session.injector;
  let cachePerInjector = cache.get(injector);
  if (cachePerInjector === undefined) {
    cachePerInjector = new WeakMap<InjectionMetadata, any>();
    cache.set(injector, cachePerInjector);
  }

  if (cachePerInjector.has(session.metadata)) {
    return cachePerInjector.get(session.metadata);
  }

  return thenable(
    () => next(session),
    value => {
      if (session.status & SessionStatus.SIDE_EFFECTS) {
        return value;
      }

      session.metadata && cachePerInjector.set(session.metadata, value);
      return value;
    }
  );
}

export const Cache = createWrapper(() => wrapper);
