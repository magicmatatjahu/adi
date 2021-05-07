import { Context, Injector, NilInjector } from "../injector";
import { getInjectionArg } from "./injectable"; 
import { InjectionSession, NextWrapper, WrapperDef } from "../interfaces";
import { Scope } from "../scope";
import { Token as ProviderToken } from "../types";
import { Reflection } from "../utils";

export function Inject<T = any>(token: ProviderToken<T>, wrapper?: WrapperDef);
export function Inject<T = any>(wrapper: WrapperDef);
export function Inject<T = any>(token: ProviderToken<T> | WrapperDef, wrapper?: WrapperDef) {
  if (token.hasOwnProperty('$$nextWrapper')) {
    wrapper = token as WrapperDef;
    token = undefined;
  }

  return function(target: Object, key: string | symbol, indexOrDescriptor?: number | PropertyDescriptor) {
    if (key !== undefined) {
      token = token || Reflection.getOwnMetadata("design:type", target, key);
    }

    const arg = getInjectionArg(target, key, indexOrDescriptor as any);
    arg.token = token as any;
    arg.options.token = token as any;
    arg.options.wrapper = wrapper;
  }
}

export function createWrapper<T = any>(wrapper: (options?: T) => WrapperDef): (options?: T | WrapperDef, next?: WrapperDef) => WrapperDef {
  const wr = (options?: T | WrapperDef, next?: WrapperDef): WrapperDef => {
    if (options && options.hasOwnProperty('$$nextWrapper')) {
      const v = wrapper();
      v['$$nextWrapper'] = options;
      return v;
    }
    const v = (wrapper as any)(options) as WrapperDef;
    v['$$nextWrapper'] = next;
    return v;
  }
  return wr;
}

export const Token = createWrapper((token: ProviderToken): WrapperDef => {
  // console.log('token');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside token');
    session.options = session.options || {} as any;
    session.options.token = token;
    return next(injector, session);
  }
});

export const Ref = createWrapper((ref: () => ProviderToken): WrapperDef => {
  // console.log('ref');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside ref');
    session.options = session.options || {} as any;
    session.options.token = ref();
    return next(injector, session);
  }
});

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

// skip injection
export const Skip = createWrapper((_: never): WrapperDef => {
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
      return next(NilInjector, session);
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
    return next(NilInjector, session);
  }
});

export const Scoped = createWrapper((scope: Scope): WrapperDef => {
  // console.log('scoped');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside scope');
    session.options.scope = scope;
    return next(injector, session);
  }
});

export const New = createWrapper((ctxData: any): WrapperDef => {
  // console.log('new');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside new');
    if (ctxData !== undefined) {
      session.options.ctx = new Context(ctxData);
    }
    session.options.scope = Scope.TRANSIENT;
    return next(injector, session);
  }
});

export const Named = createWrapper((name: string): WrapperDef => {
  // console.log('named');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside named');
    session.options.attrs['named'] = name;
    return next(injector, session);
  }
});

export const Multi = createWrapper((_: never): WrapperDef => {
  function getDefinitions(
    record: any,
    session?: InjectionSession
  ): Array<any> {
    const recordDefs = record.defs;
    const defs = [];
    for (let i = 0, l = recordDefs.length; i < l; i++) {
      const d = recordDefs[i];
      if (d.constraint(session) === true) {
        defs.push(d);
      }
    }
    return defs;
  }

  // console.log('multi');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside multi');
    const options = session.options;
    const token = options.token;
    const record = (injector as any).records.get(token);
    if (!record) {
      return [];
    }
    const defs = getDefinitions(record, session);
    return defs.map(def => (injector as any).resolveDef(def, options, session))
  }
});

interface DecorateOptions {
  decorator: ProviderToken;
  reuseScope?: true;
}

export const Decorate = createWrapper((decorator: ProviderToken | DecorateOptions): WrapperDef => {
  const token = (decorator as DecorateOptions).decorator || decorator;

  // console.log('decorate');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside decorate');

    const decoratee = next(injector, session);
    // only class for POC
    return new (decorator as any)(decoratee);
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
