import { createHook } from "./hook";
import { wait } from "../utils";

export const SessionHook = createHook(() => {
  return (session, next) => wait(next(session), _ => session);
}, { name: 'adi:hook:session' });
