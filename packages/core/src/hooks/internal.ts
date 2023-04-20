import { createHook } from "./hook";
import { wait } from "../utils";

export const SessionHook = createHook(() => {
  return (session, next) => wait(next(session), result => ({ session, result }));
}, { name: 'adi:hook:session' })();

export const InstanceHook = createHook(() => {
  return (session, next) => wait(next(session), result => ({ sideEffects: session.hasFlag('side-effect'), result, instance: session.context.instance, session }));
}, { name: 'adi:hook:instance' })();
