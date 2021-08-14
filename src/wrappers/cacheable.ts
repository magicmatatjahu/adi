import { Injector, Session } from "../injector";
import { InjectionMetadata, NextWrapper, WrapperDef } from "../interfaces";
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

// interface State {
//   flags: CacheFlags;
//   cachedValue: any | Map<Injector, any>;
//   cachedInjector: Injector; 
// }

// function algorithm(
//   injector: Injector, 
//   session: Session, 
//   next: NextWrapper, 
//   state: State,
// ) {
//   // if wrappers chain has side effects, then don't cache value
//   switch (state.flags) {
//     case CacheFlags.SINGLE: {
//       // if this same injector, return cached value
//       if (injector === state.cachedInjector) {
//         return state.cachedValue;
//       }

//       session.setSideEffect(false);
//       const value = next(injector, session);
//       if (session.hasSideEffect() === false) {
//         // create Map only when given provider has 2 cached values
//         const oldValue = state.cachedValue;
//         state.cachedValue = new Map<Injector, any>();
//         (state.cachedValue as Map<Injector, any>).set(state.cachedInjector, oldValue);
//         (state.cachedValue as Map<Injector, any>).set(injector, value);
//         state.cachedInjector = undefined;
//         state.flags = CacheFlags.MULTIPLE;
//       }
//       return value;
//     };
//     case CacheFlags.MULTIPLE: {
//       // value can be null, undefined, 0 or ""
//       if ((state.cachedValue as Map<Injector, any>).has(injector)) {
//         return (state.cachedValue as Map<Injector, any>).get(injector);
//       }

//       session.setSideEffect(false);
//       const value = next(injector, session);
//       if (session.hasSideEffect() === false) {
//         (state.cachedValue as Map<Injector, any>).set(injector, value);
//       }
//       return value;
//     };
//     case CacheFlags.SIDE_EFFECTS: {
//       return next(injector, session);
//     };
//     case CacheFlags.FIRST_RUN: {
//       session.setSideEffect(false);
//       const value = next(injector, session);
//       // if hasn't side effects then cache it
//       if (session.hasSideEffect() === false) {
//         state.flags = CacheFlags.SINGLE;
//         state.cachedValue = value;
//         state.cachedInjector = injector;
//       } else {
//         state.flags = CacheFlags.SIDE_EFFECTS;
//       }
//       return value;
//     }
//   }
// }

// function wrapper(): WrapperDef {
//   const state: State = {
//     flags: CacheFlags.FIRST_RUN,
//     cachedValue: undefined,
//     cachedInjector: undefined,
//   }
//   return (injector, session, next) => algorithm(injector, session, next, state);
// }

// export const Cacheable = createWrapper(wrapper);

/**
 * TODO: CHECK WHY IT MAKES THE STACK OVERFLOW... Probably due to saving the `$$nextWrapper` to the wrapper instance
 */
// const cache: Map<Injector, Map<InjectionMetadata, any>> = new Map();

// function algorithm(injector: Injector, session: Session, next: NextWrapper) {
//   return next(injector, session);
//   // let cachePerInjector = cache.get(injector);
//   // if (cachePerInjector === undefined) {
//   //   cachePerInjector = new Map<InjectionMetadata, any>();
//   //   cache.set(injector, cachePerInjector);
//   // }

//   // const metadata = session.getMetadata();
//   // if (cachePerInjector.has(metadata)) {
//   //   return cachePerInjector.get(metadata);
//   // }

//   // const value = next(injector, session);
//   // if (session.hasSideEffect() === false) {
//   //   const metadata = session.getMetadata();
//   //   metadata && cachePerInjector.set(metadata, value);
//   // }
//   // return value;
// }

// export const Cacheable = createWrapper(() => algorithm);

export const Cacheable = createWrapper((_: never): WrapperDef => {
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
