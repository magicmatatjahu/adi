import { WrapperDef } from "../interfaces";
import { createWrapper, thenable } from "../utils";

function index(obj: any, i: string) {
  return obj[i]
}

function wrapper(path: string): WrapperDef {
  return (injector, session, next) => {
    return thenable(next, injector, session).then(
      value => path.split('.').reduce(index, value)
    );
  }
}

export const Value = createWrapper<string, true>(wrapper);
