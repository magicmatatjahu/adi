import { NilInjectorError } from "../errors";
import { Token } from "../types";
import { createWrapper, Wrapper, thenable } from "../utils";

interface FallbackProvider {
  token: Token;
  useWrapper?: Wrapper;
}

export const Fallback = createWrapper((options: Token | FallbackProvider) => {
  let token: Token = options as Token
  let useWrapper: Wrapper = undefined;
  if ((options as FallbackProvider).token) {
    token = (options as FallbackProvider).token;
    useWrapper = (options as FallbackProvider).useWrapper;
  }

  return (session, next) => {
    const forkedSession = session.fork();
    return thenable(
      () => next(session),
      val => val,
      err => {
        if ((err as NilInjectorError).isNilInjectorError) {
          const newSession = forkedSession.fork();
          newSession.setToken(token);
          newSession.record = undefined;
          newSession.definition = undefined;
          newSession.instance = undefined;
          return session.injector.get(token, useWrapper, newSession);
        }
        throw err;
      }
    );
  }
}, { name: 'Fallback' });
