import { Context, Injector, NilInjector } from "../injector";
import { applyInjectionArg } from "./injectable"; 
import { InjectionSession, NextWrapper, WrapperDef } from "../interfaces";
import { Scope } from "../scope";
import { Token as ProviderToken } from "../types";
import { Reflection } from "../utils";

export function Inject<T = any>(token?: ProviderToken<T>, useWrapper?: WrapperDef);
export function Inject<T = any>(useWrapper: WrapperDef);
export function Inject<T = any>(token: ProviderToken<T> | WrapperDef, useWrapper?: WrapperDef) {
  if (token && token.hasOwnProperty('$$nextWrapper')) {
    useWrapper = token as WrapperDef;
    token = undefined;
  }

  return function(target: Object, key: string | symbol, index?: number | PropertyDescriptor) {
    if (token === undefined) {
      if (key === undefined) { // constructor injection
        token = Reflection.getOwnMetadata("design:paramtypes", target)[index as number];
      } else {
        if (index === undefined) { // property injection
          token = Reflection.getOwnMetadata("design:type", target, key);
        } else if (typeof index === 'number') { // method injection
          token = Reflection.getOwnMetadata("design:paramtypes", target, key)[index];
        } else if (typeof index.value === 'function') { // whole method injection
          const paramtypes = Reflection.getOwnMetadata("design:paramtypes", target, key);
          for (let i = 0, l = paramtypes.length; i < l; i++) {
            applyInjectionArg(paramtypes[i], useWrapper, target, key, i);
          }
          return;
        } else { // setter injection
          token = Reflection.getOwnMetadata("design:type", target, key);
        }
      }
    }
    applyInjectionArg(token, useWrapper, target, key, index);
  }
}

interface WrapperOptions {
  sideEffects?: boolean;
}

// TODO: Improve inheritance of wrappers in extending case - it should be new wrappers, not these same as in parent class
export function createWrapper<T = any>(
  useWrapper: (options?: T) => WrapperDef,
  wrapperOptions?: WrapperOptions,
): (options?: T | WrapperDef, next?: WrapperDef) => WrapperDef {
  const wr = (optionsOrWrapper?: T | WrapperDef, next?: WrapperDef): WrapperDef => {
    // case when defined wrapper
    if (optionsOrWrapper && optionsOrWrapper.hasOwnProperty('$$nextWrapper')) {
      const v = useWrapper();
      v['$$wrapperDef'] = useWrapper;
      v['$$nextWrapper'] = optionsOrWrapper;
      v['$$options'] = undefined;
      return v;
    }
    const v = (useWrapper as any)(optionsOrWrapper) as WrapperDef;
    v['$$wrapperDef'] = useWrapper;
    v['$$nextWrapper'] = next;
    v['$$options'] = optionsOrWrapper;
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

export class DelayedConstructor<T> {
  private reflectMethods: ReadonlyArray<keyof ProxyHandler<any>> = [
    "get",
    "getPrototypeOf",
    "setPrototypeOf",
    "getOwnPropertyDescriptor",
    "defineProperty",
    "has",
    "set",
    "deleteProperty",
    "apply",
    "construct",
    "ownKeys"
  ];

  public createProxy(createObject: () => T): T {
    const target: object = {};
    let init = false;
    let value: T;
    const delayedObject: () => T = (): T => {
      if (!init) {
        value = createObject();
        init = true;
      }
      return value;
    };
    return new Proxy<any>(target, this.createHandler(delayedObject)) as T;
  }

  private createHandler(delayedObject: () => T): ProxyHandler<object> {
    const handler: ProxyHandler<object> = {};
    const install = (name: keyof ProxyHandler<any>): void => {
      handler[name] = (...args: any[]) => {
        args[0] = delayedObject();
        const method = Reflect[name];
        return (method as any)(...args);
      };
    };
    this.reflectMethods.forEach(install);
    return handler;
  }
}

// works only with objects!
export const Lazy = createWrapper((_: never): WrapperDef => {
  // console.log('lazy');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside lazy');
    const delay = new DelayedConstructor();
    const proxy = delay.createProxy(() => {
      return next(injector, session);
    });
    return proxy;
    // let value: any, resolved = false;
    // return () => {
    //   if (resolved === false) {
    //     value = next(injector, session);
    //     resolved = true;
    //   }
    //   return value;
    // };
  }
});
