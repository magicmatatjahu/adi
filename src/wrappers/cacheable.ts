import { Injector } from "../injector";
import { WrapperDef } from "../interfaces";
import { createWrapper } from "../utils";

enum CacheFlags {
  // single cached value (provider is used only in one module/injectors)
  SINGLE,
  // multiple cached values (from different modules/injector)
  MULTIPLE,
  // side effects
  SIDE_EFFECTS,
  // first run of wrapper, it means first injection
  FIRST_RUN,
}

export const Cacheable = createWrapper((_: never): WrapperDef => {
  /**
   * 0 - single cached value (provider is used only in one module/injectors)
   * 1 - multiple cached values (from different modules/injector)
   * 2 - side effects
   * 4 - first run of wrapper, it means first injection
   */
  let flags: CacheFlags = CacheFlags.FIRST_RUN;
  let cachedValue: any | Map<Injector, any>;
  let cachedInjector: Injector; 
  return (injector, session, next) => {
    // if wrappers chain has side effects, then don't cache value
    switch (flags) {
      case CacheFlags.SINGLE: {
        // if this same injector, return cached value
        if (injector === cachedInjector) {
          return cachedValue;
        }

        session.setSideEffect(false);
        const value = next(injector, session);
        if (session.hasSideEffect() === false) {
          // create Map only when given provider has 2 cached values
          const oldValue = cachedValue;
          cachedValue = new Map<Injector, any>();
          (cachedValue as Map<Injector, any>).set(cachedInjector, oldValue);
          (cachedValue as Map<Injector, any>).set(injector, value);
          cachedInjector = undefined;
          flags = CacheFlags.MULTIPLE;
        }
        return value;
      };
      case CacheFlags.MULTIPLE: {
        // value can be null, undefined, 0 or ""
        if ((cachedValue as Map<Injector, any>).has(injector)) {
          return (cachedValue as Map<Injector, any>).get(injector);
        }

        session.setSideEffect(false);
        const value = next(injector, session);
        if (session.hasSideEffect() === false) {
          (cachedValue as Map<Injector, any>).set(injector, value);
        }
        return value;
      };
      case CacheFlags.SIDE_EFFECTS: {
        return next(injector, session);
      };
      case CacheFlags.FIRST_RUN: {
        session.setSideEffect(false);
        const value = next(injector, session);
        // if hasn't side effects then cache it
        if (session.hasSideEffect() === false) {
          flags = CacheFlags.SINGLE;
          cachedValue = value;
          cachedInjector = injector;
        } else {
          flags = CacheFlags.SIDE_EFFECTS;
        }
        return value;
      }
    }
  }
});