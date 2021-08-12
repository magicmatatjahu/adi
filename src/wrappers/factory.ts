import { WrapperDef } from "../interfaces";
import { NULL_REF } from "../constants";
import { createWrapper } from "../utils";

/**
 * Factory
 */
function factoryWrapper(): WrapperDef {
  return (injector, session, next) => {
    const oldSession = session.copy();
    return (...args: any[]) => {
      const newSession = oldSession.copy();
      if (Array.isArray(args) && args.length > 0) {
        newSession['$$assisted'] = args;
        return next(injector, newSession);
      }
      return next(injector, newSession);
    }
  }
}

export const Factory = createWrapper(factoryWrapper);

/**
 * Assisted
 */
function assistedWrapper(index: number): WrapperDef {
  return (injector, session, next) => {
    const assisted = session.retrieveDeepMeta('$$assisted');
    // values isn't set
    if (assisted === NULL_REF) {
      return next(injector, session);
    }
    session.setSideEffect(true);
    return assisted[index];
  }
}

export const Assisted = createWrapper(assistedWrapper);