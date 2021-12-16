import { createWrapper } from "../utils";

export const Skip = createWrapper((value?: any) => {
  return () => value;
}, { name: 'Skip' });
