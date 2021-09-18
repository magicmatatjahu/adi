import { SessionStatus } from "../enums";
import { WrapperDef } from "../interfaces";
import { createWrapper, thenable } from "../utils";

function getDeepValue(value: object, props: string[]) {
  let result = value;
  for (const p of props) {
    if (result === null || result === undefined) {
      return result;
    }
    result = result[p];
  }
  return result;
}

function wrapper(path: string): WrapperDef {
  const props = path.split('.').filter(Boolean);
  return (injector, session, next) => {
    if (session.status & SessionStatus.DRY_RUN) {
      return next(injector, session);
    }

    return thenable(
      () => next(injector, session),
      value => getDeepValue(value, props),
    );
  }
}

export const Path = createWrapper<string, true>(wrapper);
