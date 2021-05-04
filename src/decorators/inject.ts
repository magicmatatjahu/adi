import { Injector, NilInjector } from "../injector";
import { ForwardRef, InjectionSession, NextWrapper, WrapperDef } from "../interfaces";
import { Scope } from "../scope";
import { Token } from "../types";
import { Reflection } from "../utils";
import { getInjectionArg } from "./injectable"; 

export function Inject<T = any>(token: Token<T> | ForwardRef<T>, wrapper?: WrapperDef);
export function Inject<T = any>(wrapper: WrapperDef);
export function Inject<T = any>(token: Token<T> | ForwardRef<T>, wrapper?: WrapperDef) {
  if (token['$$wrapper'] === true) {
    token = undefined;
    wrapper = token as WrapperDef;
  }

  return function(target: Object, key: string | symbol, indexOrDescriptor?: number | PropertyDescriptor) {
    if (key !== undefined) {
      token = token || Reflection.getOwnMetadata("design:type", target, key);
    }

    const arg = getInjectionArg(target, key, indexOrDescriptor as any);
    arg.token = token as any;
    arg.options.wrapper = wrapper;
  }
}

export function createWrapper<T = any>(wrapper: (options?: T) => WrapperDef): (options?: T | WrapperDef, next?: WrapperDef) => WrapperDef {
  const wr = (options?: T | WrapperDef, next?: WrapperDef): WrapperDef => {
    if (options && options.hasOwnProperty('$$next')) {
      const v = wrapper();
      v['$$next'] = options;
      return v;
    }
    const v = (wrapper as any)(options) as WrapperDef;
    v['$$next'] = next;
    return v;
  }
  (wr as any)['$$wrapper'] = true;
  return wr;
}

export const Optional = createWrapper((_: never): WrapperDef => {
  // console.log('optional');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside optional');
    try {
      return next(injector, session);
    } catch(err) {
      if (err.name === 'NilInjectorError') return undefined;
      throw err;
    }
  }
});

export const NoInject = createWrapper((_: never): WrapperDef => {
  // console.log('noinject');
  return () => {
    // console.log('inside noinject');
    return undefined;
  }
});

export const Self = createWrapper((_: never): WrapperDef => {
  // console.log('self');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside self');
    const token = session.options.token;
    const ownRecord = (injector as any).records.get(token);
    // if token is not found
    if (ownRecord === undefined) {
      return NilInjector.get(token);
    }
    return next(injector, session);
  }
});

export const SkipSelf = createWrapper((_: never): WrapperDef => {
  // console.log('skipSelf');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside skipSelf');
    const token = session.options.token;
    let parentInjector = injector.getParentInjector();
    const ownRecord = (injector as any).records.get(token);

    while (parentInjector !== NilInjector) {
      if (
        (parentInjector as any).records.get(token) ||
        (parentInjector as any).importedRecords.get(token) !== ownRecord
      ) {
        return next(parentInjector, session);
      }
      parentInjector = parentInjector.getParentInjector();
    }
    return NilInjector.get(token);
  }
});

export const Scoped = createWrapper((scope: Scope): WrapperDef => {
  // console.log('scoped');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside scoped');
    return next(injector, session);
  }
});

export const New = createWrapper((options: never): WrapperDef => {
  console.log('new');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    console.log('inside new');
    return next(injector, session);
  }
});

export const Decorate = createWrapper((options: never): WrapperDef => {
  console.log('decorate');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    console.log('inside decorate');
    return next(injector, session);
  }
});

// @Inject('token', Optional(Self()))

// export function Inject<T = any>(token: Token<T> | ForwardRef<T>);
// export function Inject<T = any>(ctx: Context);
// export function Inject<T = any>(inject: false);
// export function Inject<T = any>(token: Token<T> | ForwardRef<T>, ctx?: Context);
// export function Inject<T = any>(token: Token<T> | Context | ForwardRef<T> | false, ctx?: Context) {
//   if (token instanceof Context) {
//     ctx = token;
//     token = undefined;
//   } 

//   return function(target: Object, key: string | symbol, indexOrDescriptor?: number | PropertyDescriptor) {
//     if (key !== undefined) {
//       token = token || Reflection.getOwnMetadata("design:type", target, key);
//     }

//     const arg = getInjectionArg(target, key, indexOrDescriptor as any);
//     arg.token = token as any;
//     arg.options.ctx = ctx;
//   }
// }
