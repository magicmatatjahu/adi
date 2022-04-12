import { createHook } from "./hook";

export const Skip = createHook((value?: any) => {
  return () => value;
}, { name: 'adi:hook:skip' });
