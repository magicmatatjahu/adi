import { WrapperDef } from "../interfaces";
import { createWrapper } from "../utils";

function wrapper(value: any): WrapperDef {
  return () => value;
}

export const Value = createWrapper<any, false>(wrapper);
