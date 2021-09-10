import { Session } from "../injector";
import { NilInjectorError } from "../errors";
import { WrapperDef } from "../interfaces";
import { Token } from "../types";
import { createWrapper, thenable, Wrapper } from "../utils";

interface FallbackProvider {
  token: Token;
  useWrapper?: Wrapper;
}

function wrapper(options: Token | FallbackProvider): WrapperDef {
  let token: Token = options as Token
  let useWrapper: Wrapper = undefined;
  if ((options as FallbackProvider).token) {
    token = (options as FallbackProvider).token;
    useWrapper = (options as FallbackProvider).useWrapper;
  }

  return (injector, session, next) => {
    const forkedSession = session.fork();
    return thenable(
      () => next(injector, session),
      val => val,
      err => {
        if ((err as NilInjectorError).isNilInjectorError) {
          // TODO: Change to `session.fork()` and set undefined to the record, definition and instance
          const newSession = new Session(undefined, undefined, undefined, { ...forkedSession.options, token }, forkedSession.metadata, forkedSession.parent);
          return injector.get(token, useWrapper, newSession);
        }
        throw err;
      }
    );
  }
}

export const Fallback = createWrapper<Token | FallbackProvider, true>(wrapper);
