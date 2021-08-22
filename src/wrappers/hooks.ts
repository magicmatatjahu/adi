import { CIRCULAR } from "../constants";
import { WrapperDef } from "../interfaces";
import { InjectionStatus } from "../enums";
import { createWrapper, hasOnInitHook, hasOnDestroyHook, Wrapper, thenable } from "../utils";

// Make it more easier to understand
function onInit(): WrapperDef {
  return (injector, session, next) => {
    return thenable(next, injector, session).then(
      value => {
        // when resolution chain has circular reference
        // TODO: optimize it
        if (session[CIRCULAR.ANNOTATION]) {
          const instance = session.instance;
          if (
            instance.status & InjectionStatus.CIRCULAR &&
            session[CIRCULAR.START_ANNOTATION] === instance.value
          ) {
            // merge circular object
            // Object.assign(instance.value, value);
    
            const circulars = session[CIRCULAR.ANNOTATION];
            for (let i = 0, l = circulars.length; i < l; i++) {
              const circularValue = circulars[i];
              hasOnInitHook(circularValue) && circularValue.onInit();
            }
            hasOnInitHook(value) && value.onInit();
          } else if (session.parent) {
            if (Array.isArray(session.parent[CIRCULAR.ANNOTATION])) {
              session.parent[CIRCULAR.ANNOTATION] = [...session[CIRCULAR.ANNOTATION], value, ...session.parent[CIRCULAR.ANNOTATION]];
            } else {
              session.parent[CIRCULAR.ANNOTATION] = [...session[CIRCULAR.ANNOTATION], value];
            }
            session.parent[CIRCULAR.START_ANNOTATION] = session.parent[CIRCULAR.START_ANNOTATION] || session[CIRCULAR.START_ANNOTATION];
          }
        } else if (hasOnInitHook(value) && session.parent?.[CIRCULAR.ANNOTATION] === undefined) {
          value.onInit();
        }
        return value;
      },
    );
  }
}

function onDestroy(): WrapperDef {
  return (injector, session, next) => {
    const value = next(injector, session);
    if (hasOnDestroyHook(value)) {
      value.onDestroy();
    }
    return value;
  }
}

export const OnInitHook = createWrapper<undefined, false>(onInit);
export const OnDestroyHook = createWrapper<undefined, false>(onDestroy);
