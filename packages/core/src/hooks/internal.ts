import { createHook } from "./hook";
import { wait } from "../utils";

export const SessionHook = createHook(() => {
  return (session, next) => wait(next(session), result => ({ session, result }));
}, { name: 'adi:hook:session' });

export const HasSideEffect = createHook(() => {
  return (session, next) => wait(next(session), result => ({ has: session.hasFlag('side-effect'), result, instance: session.context.instance }));
}, { name: 'adi:hook:has-side-effect' });
