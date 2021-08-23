import { WrapperDef } from "../interfaces";
import { createWrapper, thenable } from "../utils";

function wrapper(path: string): WrapperDef {
  return (injector, session, next) => {
    return thenable(next, injector, session).then(
      value => {
        let result = value;
        const props = path.split('.').filter(Boolean);
        for (const p of props) {
          if (result === null || result === undefined) {
            return result;
          }
          result = result[p];
        }
        return result;
      }
    );
  }
}

export const Value = createWrapper<string, true>(wrapper);
