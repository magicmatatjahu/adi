import { createHook } from "./hook";
import { wait } from "../utils";

export const SessionHook = createHook(() => {
  return (session, next) => wait(next(session), result => ({ session, result }));
}, { name: 'adi:hook:session' });
