import { WrapperDef } from "../interfaces";
import { createNewWrapper, createWrapper } from "../utils";

function wrapper(value: any) {
  return () => value;
}

export const Value = createWrapper<any, false>(wrapper);

export const NewValue = createNewWrapper(wrapper);