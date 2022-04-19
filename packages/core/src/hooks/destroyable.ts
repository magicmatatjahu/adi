import { createHook } from "./hook";
import { destroy } from "../injector";
import { wait } from "../utils";

export interface DestroyableType<T> {
  value: T;
  destroy: () => Promise<void>;
}

export const Destroyable = createHook(() => {
  return (session, next) => {
    return wait(
      next(session),
      value => ({
        value,
        destroy: () => destroy(session.ctx.instance, 'manually'),
      }),
    );
  }
}, { name: 'adi:hook:destroyable' });
