import { createHook } from "@adi/core";

export const Skip = createHook(() => {
  return () => undefined;
}, { name: 'adi:hook:skip' });
