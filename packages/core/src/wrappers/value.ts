import { createWrapper } from "../utils";

export const Value = createWrapper((value: any) => {
  return () => value;
}, { name: 'Value' });