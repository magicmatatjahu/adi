import { WRAPPER_DEF } from "../constants";
import { NextWrapper, WrapperDef } from "../interfaces";
import { ProviderRecord, Session } from "../injector";

export interface Wrapper {
  func: WrapperDef;
  $$wr: object;
}

export function createWrapper<F extends (...args: any) => WrapperDef>(useWrapper: F): (...args: Parameters<F>) => Wrapper {
  return function(...args: any): Wrapper {
    return {
      func: useWrapper(...args),
      $$wr: WRAPPER_DEF,
    };
  }
}

export function runWrappers(wrappers: Array<Wrapper> | Wrapper, session: Session, last: NextWrapper) {
  if (Array.isArray(wrappers)) {
    const length = wrappers.length - 1;
    const nextWrapper = (i: number) => (session: Session) => {
      const next: NextWrapper = i === length ? last : (s: Session) => nextWrapper(i+1)(s);
      return wrappers[i].func(session, next);
    }
    return nextWrapper(0)(session);
  }
  return wrappers.func(session, last);
}

export function runRecordsWrappers(wrappers: Array<{ record: ProviderRecord, wrapper: Wrapper }>, session: Session, last: NextWrapper) {
  const length = wrappers.length - 1;
  const nextWrapper = (i: number) => (session: Session) => {
    const next: NextWrapper = i === length ? last : (s: Session) => nextWrapper(i+1)(s);
    const item = wrappers[i];
    session.record = item.record;
    session.injector = item.record.host;
    return item.wrapper.func(session, next);
  }
  return nextWrapper(0)(session);
}
