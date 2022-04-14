import { createHook } from "./hook";
import { wait } from "../utils";

export const WithSession = createHook(() => {
  return (session, next) => wait(next(session), value => ({ value, session }));
}, { name: 'adi:hook:with-session' });

export const WithInstance = createHook(() => {
  return (session, next) => wait(next(session), value => ({ value, instance: session.ctx.instance }));
}, { name: 'adi:hook:with-instance' });
