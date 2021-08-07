import { WrapperDef } from "../interfaces";
import { createWrapper, hasOnInitHook, hasOnDestroyHook } from "../utils";
import { InjectionStatus } from "../enums";

// Make it more easier to understand
export const OnInitHook = createWrapper((_: never): WrapperDef => {
  return (injector, session, next) => {
    const value = next(injector, session);

    // when resolution chain has circular reference
    // TODO: optimize it
    if (session['$$circular'] ) {
      if (
        session.instance.status & InjectionStatus.CIRCULAR &&
        session['$$startCircular'] === session.instance.value
      ) {
        // merge circular object
        Object.assign(session.instance.value, value);

        const circulars = session['$$circular'];
        for (let i = 0, l = circulars.length; i < l; i++) {
          const circularValue = circulars[i];
          hasOnInitHook(circularValue) && circularValue.onInit();
        }
        hasOnInitHook(value) && value.onInit();
        // delete session['$$circular'];
      } else if (session.parent) {
        if (Array.isArray(session.parent['$$circular'])) {
          session.parent['$$circular'] = [...session['$$circular'], value, ...session.parent['$$circular']];
        } else {
          session.parent['$$circular'] = [...session['$$circular'], value];
        }
        session.parent['$$startCircular'] = session.parent['$$startCircular'] || session['$$startCircular'];
      }
    } else if (hasOnInitHook(value)) {
      value.onInit();
    }
    return value;
  }
});

export const OnDestroyHook = createWrapper((_: never): WrapperDef => {
  return (injector, session, next) => {
    const value = next(injector, session);
    if (hasOnDestroyHook(value)) {
      value.onDestroy();
    }
    return value;
  }
});

export function useDefaultHooks(wrapper?: WrapperDef): WrapperDef {
  return OnInitHook(wrapper);
}
