import { NULL_REF } from "../constants";
import { NextWrapper, WrapperDef } from "../interfaces";
import { Injector, Session } from "../injector";

export interface Wrapper {
  prev?: Wrapper;
  func: WrapperDef;
  next?: Wrapper;
  $$wr: object;
}

type WrapperFnType<T, R extends boolean> = any
  // T extends undefined
  //   ? (wrapper?: Wrapper) => Wrapper
  //   : R extends true 
  //     ? (options: T, wrapper?: Wrapper) => Wrapper
  //     : ((options?: T | Wrapper, wrapper?: Wrapper) => Wrapper)

export function createWrapper<T, R extends boolean>(useWrapper: (options?: T) => WrapperDef): WrapperFnType<T, R> {
  return function(options?: T | Wrapper, wrapper?: Wrapper): Wrapper {
    if (options && (options as Wrapper).$$wr === NULL_REF) {
      const w: Wrapper = {
        prev: undefined,
        func: useWrapper(undefined),
        next: options as Wrapper,
        $$wr: NULL_REF,
      };
      (options as Wrapper).prev = w;
      return w;
    }
    const w: Wrapper = {
      prev: undefined,
      func: useWrapper(options as T),
      next: wrapper,
      $$wr: NULL_REF,
    };
    wrapper && ((wrapper as Wrapper).prev = w);
    return w;
  } as WrapperFnType<T, R>
}

// TODO: optimize it by adding to the Wrapper $$next - optimized nextWrapper function
export function runWrappers<T>(wrapper: Wrapper, injector: Injector, session: Session, lastWrapper: NextWrapper): T {
  const next: NextWrapper = wrapper.next ? (inj: Injector, s: Session) => runWrappers(wrapper.next, inj, s, lastWrapper) : lastWrapper;
  return wrapper.func(injector, session, next);
}

// TODO: optimize it by adding to the Wrapper $$next - optimized nextWrapper function
export function runArrayOfWrappers<T>(wrappers: Wrapper[], injector: Injector, session: Session, lastWrapper: NextWrapper): T {
  const length = wrappers.length;
  const nextWrappers = (i = 0) => (inj1: Injector, s1: Session) => {
    i++;
    const next: NextWrapper = i === length ? lastWrapper : (inj2: Injector, s2: Session) => nextWrappers(i)(inj2, s2);
    return runWrappers(wrappers[i-1], inj1, s1, next);
  }
  return nextWrappers()(injector, session) as T;
}

export function copyWrappers(wrapper: Wrapper): Wrapper {
  const newWrapper = wrapper ? { ...wrapper } : undefined;
  if (newWrapper) {
    newWrapper.next = copyWrappers(wrapper.next);
    if (newWrapper.next && newWrapper.next.prev) {
      (newWrapper.next.prev = newWrapper);
    }
  }
  return newWrapper;
}