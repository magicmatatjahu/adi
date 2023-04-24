import { createHook } from "./hook";
import { destroy } from "../injector";
import { wait } from "../utils";

export type DestroyableType<T> = {
  value: T;
  destroy: () => Promise<void>;
}

export const Destroyable = createHook(() => {
  return (session, next) => {
    return wait(
      next(session),
      value => {
        session.setFlag('side-effect');
        return {
          value,
          destroy: () => destroy(session.context.instance, { event: 'manually' }),
        }
      }
    );
  }
}, { name: 'adi:hook:destroyable' });
