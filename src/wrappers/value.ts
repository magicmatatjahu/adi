import { WrapperDef } from "../interfaces";
import { createWrapper } from "../utils";

function index(obj: any, i: string) {
  return obj[i]
}

function wrapper(path: string): WrapperDef {
  return (injector, session, next) => {
    const value = next(injector, session);
    return path.split('.').reduce(index, value)
  }
}

export const Value = createWrapper<string, true>(wrapper);
