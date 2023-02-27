import { createHook } from "./hook";
import { NoProviderError } from "../problem";
import { waitCallback } from "../utils";

export type OptionalType<T> = T | undefined; 

export const Optional = createHook((value?: any) => {
  return (session, next) => {
    return waitCallback(
      () => next(session),
      undefined,
      err => {
        if (err instanceof NoProviderError) {
          return value;
        }
        throw err;
      }
    );
  }
}, { name: 'adi:hook:optional' })