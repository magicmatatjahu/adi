import { Context, Injector, Session } from "../injector";
import { WrapperDef } from "../interfaces";
import { Token } from "../types";
import { createWrapper } from "../utils/wrappers";

function useExisting(token: Token): WrapperDef {
  return (injector, session) => {
    const newSession = session.copy();
    newSession.setToken(token);
    return injector.get(token, undefined, newSession);
  }
}

export const UseExisting = createWrapper<Token, true>(useExisting);

function getContext(_: Injector, session: Session) {
  const parent = session.parent;
  if (parent === undefined) {
    throw new Error('Context provider can be only used in other providers');
  }
  return parent.instance.ctx;
}

export const GetContext = createWrapper<undefined, false>(() => getContext);

function getSession(_: Injector, session: Session) {
  const parent = session.parent;
  if (parent === undefined) {
    throw new Error('Session provider can be only used in other providers');
  }
  return parent;
}

export const GetSession = createWrapper<undefined, false>(() => getSession);