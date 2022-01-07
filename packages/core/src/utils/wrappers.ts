import { NextWrapper, WrapperDef } from "../interfaces";
import { ProviderRecord, Session } from "../injector";

export const WRAPPER_DEF = {};

export interface WrapperOptions {
  name: string;
}

export interface Wrapper {
  func: WrapperDef;
  options: WrapperOptions;
  $$wr: object;
}

export function createWrapper<F extends (...args: any) => WrapperDef>(useWrapper: F, options?: WrapperOptions): (...args: Parameters<F>) => Wrapper {
  return function(...args: any): Wrapper {
    return {
      func: useWrapper(...args),
      options,
      $$wr: WRAPPER_DEF,
    };
  }
}

export function isWrapper(wrapper: unknown): wrapper is Wrapper | Array<Wrapper> {
  return wrapper && (
    (wrapper as Wrapper).$$wr === WRAPPER_DEF || 
    Array.isArray(wrapper)
  );
}

export function runWrappers(wrappers: Array<Wrapper> | Wrapper, session: Session, last: NextWrapper) {
  if (Array.isArray(wrappers)) {
    const length = wrappers.length - 1;
    const nextWrapper = (session: Session, i: number) => {
      const next: NextWrapper = i === length ? last : (s: Session) => nextWrapper(s, i+1);
      return wrappers[i].func(session, next);
    }
    return nextWrapper(session, 0);
  }
  return wrappers.func(session, last);
}

export function runRecordsWrappers(wrappers: Array<{ record: ProviderRecord, wrapper: Wrapper }>, session: Session, last: NextWrapper) {
  const length = wrappers.length - 1;
  const nextWrapper = (session: Session, i: number) => {
    const next: NextWrapper = i === length ? last : (s: Session) => nextWrapper(s, i+1);
    const item = wrappers[i];
    session.injector = (session.record = item.record).host;
    return item.wrapper.func(session, next);
  }
  return nextWrapper(session, 0);
}

export function pushWrapper(wrapper: Wrapper | Array<Wrapper> | undefined, newWrapper: Wrapper) {
  if (wrapper) {
    if (Array.isArray(wrapper)) wrapper.push(newWrapper);
    else wrapper = [wrapper, newWrapper];
    return wrapper;
  }
  return newWrapper;
}