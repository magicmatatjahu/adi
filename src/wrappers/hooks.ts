import { WrapperDef } from "../interfaces";
import { hasOnInitHook, hasOnDestroyHook } from "../utils";
import { InjectionStatus } from "../enums";
import { createWrapper, Wrapper, thenable } from "../utils";

// Make it more easier to understand
function onInit(): WrapperDef {
  return (injector, session, next) => {
    return thenable(next)(injector, session).then(
      value => {
        // console.log(value)
        // when resolution chain has circular reference
        // TODO: optimize it
        if (session['$$circular']) {
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
        } else if (hasOnInitHook(value) && session.parent?.['$$circular'] === undefined) {
          value.onInit();
        }
        return value;
      },
    );
    // const value = next(injector, session);
    
    // // when resolution chain has circular reference
    // // TODO: optimize it
    // if (session['$$circular']) {
    //   if (
    //     session.instance.status & InjectionStatus.CIRCULAR &&
    //     session['$$startCircular'] === session.instance.value
    //   ) {
    //     // merge circular object
    //     Object.assign(session.instance.value, value);

    //     const circulars = session['$$circular'];
    //     for (let i = 0, l = circulars.length; i < l; i++) {
    //       const circularValue = circulars[i];
    //       hasOnInitHook(circularValue) && circularValue.onInit();
    //     }
    //     hasOnInitHook(value) && value.onInit();
    //     // delete session['$$circular'];
    //   } else if (session.parent) {
    //     if (Array.isArray(session.parent['$$circular'])) {
    //       session.parent['$$circular'] = [...session['$$circular'], value, ...session.parent['$$circular']];
    //     } else {
    //       session.parent['$$circular'] = [...session['$$circular'], value];
    //     }
    //     session.parent['$$startCircular'] = session.parent['$$startCircular'] || session['$$startCircular'];
    //   }
    // } else if (hasOnInitHook(value) && session.parent?.['$$circular'] === undefined) {
    //   value.onInit();
    // }
    // return value;
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

// export const OnInitHook = createWrapper(onInit);
export const OnInitHook = createWrapper<undefined, false>(onInit);
// export const OnDestroyHook = createWrapper(onDestroy);
export const OnDestroyHook = createWrapper<undefined, false>(onDestroy);

export function useDefaultHooks(wrapper?: Wrapper): Wrapper {
  return OnInitHook(wrapper);
}
