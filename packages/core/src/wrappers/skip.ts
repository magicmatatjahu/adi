import { createNewWrapper, createWrapper } from "../utils";

function wrapper(value?: any) {
  return () => value;
}

export const Skip = createWrapper<any, false>(wrapper);

export const NewSkip = createNewWrapper(wrapper);
