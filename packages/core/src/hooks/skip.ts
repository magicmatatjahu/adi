import { createHook } from "./hook";

export const Skip = createHook(() => {
  return () => undefined;
}, { name: 'adi:hook:skip' });