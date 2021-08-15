import { WrapperDef } from "../interfaces";
import { createWrapper } from "../utils";
import { createWrapper as cr } from "../utils/wrappers.new";

function wrapper(value?: any): WrapperDef {
  return () => value;
}

export const NewSkip = cr<any, false>(wrapper);
export const Skip = createWrapper(wrapper);
