import { WrapperDef } from "../interfaces";
import { Token } from "../types";
import { createWrapper, Wrapper } from "../utils/wrappers";

interface FacadeInjection {
  token: Token;
  wrapper: Wrapper;
}

interface FacadeOptions {
  delegations?: Record<string | symbol, FacadeInjection>;
  injections?: {
    parameters: Array<FacadeInjection>;
    properties: Record<string | symbol, FacadeInjection>;
    methods: Record<string, FacadeInjection[]>;
  }
}

function wrapper(options: FacadeOptions): WrapperDef {
  return (injector, session, next) => {
    if (options.delegations) {
      session['$$delegate'] = {
        type: 'multiple',
        values: options.delegations,
      };
    }

    return next(injector, session);
  }
}

export const Facade = createWrapper<FacadeOptions, true>(wrapper);
