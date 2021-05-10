import { Context, Injector, NilInjector } from "./injector";
import { InjectionSession, NextWrapper, WrapperDef } from "./interfaces";
import { Scope } from "./scope";
import { Token as ProviderToken, Token as ProvideToken } from "./types";
import { createWrapper, hasOnInitHook, hasOnDestroyHook } from "./utils";
import { CONSTRAINTS } from "./constants";
import { InjectionStatus } from "./enums";

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
      if ((err as any).NilInjectorError === true) return undefined;
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

export const Named = createWrapper((name: string): WrapperDef => {
  // console.log('named');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside named');
    session.options.attrs[CONSTRAINTS.NAMED] = name;
    return next(injector, session);
  }
});

export const Tagged = createWrapper((records: Record<string | symbol, any>): WrapperDef => {
  // console.log('tagged');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside tagged');
    session.options.attrs = Object.assign(session.options.attrs, records);
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

export const Fallback = createWrapper((token: ProviderToken): WrapperDef => {
  // console.log('fallback');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside fallback');
    try {
      return next(injector, session);
    } catch(err) {
      if ((err as any).NilInjectorError === true) {
        session.options = session.options || {} as any;
        session.options.token = token;
        return next(injector, session);
      }
      throw err;
    }
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

export const Lazy = createWrapper((_: never): WrapperDef => {
  // console.log('lazy');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside lazy');

    // when someone retrieve provider by `injector.get(...)`
    if (session.parent === undefined) {
      let value: any, resolved = false;
      return () => {
        if (resolved === false) {
          value = next(injector, session);
          resolved = true;
        }
        return value;
      };
    }

    if (!session.meta.propertyKey) {
      throw Error('in Lazy wrapper');
    }

    const parentInstance = session.instance.value;
    let value = undefined, isSet = false;
    Object.defineProperty(parentInstance, session.meta.propertyKey, {
      configurable: true,
      enumerable: true,
      get() {
        if (isSet === true) {
          return value;
        }
        isSet = true;
        return value = next(injector, session);
      },
      set(newValue: any) {
        isSet === true;
        value = newValue;
      }
    });
  }
});

const reflectMethods: ReadonlyArray<keyof ProxyHandler<any>> = [
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

function createHandler<T>(delayedObject: () => T): ProxyHandler<object> {
  const handler: ProxyHandler<object> = {};
  const install = (name: keyof ProxyHandler<any>): void => {
    handler[name] = (...args: any[]) => {
      args[0] = delayedObject();
      const method = Reflect[name];
      return (method as any)(...args);
    };
  };
  reflectMethods.forEach(install);
  return handler;
}

function createProxy<T = any>(createObject: () => T): T {
  const target: object = {};
  let value: T, init = false;
  const delayedObject: () => T = (): T => {
    if (init === false) {
      value = createObject();
      init = true;
    }
    return value;
  };
  return new Proxy<any>(target, createHandler(delayedObject)) as T;
}

// works only with objects!
export const LazyProxy = createWrapper((_: never): WrapperDef => {
  // console.log('lazy proxy');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside lazy proxy');
    const proxy = createProxy(() => {
      return next(injector, session);
    });
    return proxy;
  }
});

export const Memo = createWrapper((_: never): WrapperDef => {
  // console.log('memo');
  let value: any, init = false;
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside memo');
    if (init === false) {
      value = next(injector, session);
      session['$$sideEffects'] = false;
      init = true;
    }
    return value;
  }
});

export const SideEffects = createWrapper((_: never): WrapperDef => {
  // console.log('side effects');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside side effects');
    const value = next(injector, session);
    session['$$sideEffects'] = true;
    return value;
  }
});

export const OnInitHook = createWrapper((_: never): WrapperDef => {
  // console.log('onInitHook');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside onInitHook');
    const value = next(injector, session);

    // when resolution chain has circular reference
    // TODO: OPTIMIZE IT!!!
    if (session['$$circular'] ) {
      if (
        session.instance.status & InjectionStatus.CIRCULAR &&
        session['$$startCircular'] === session.instance.value
      ) {
        // merge circular object
        Object.assign(session.instance.value, value);

        const circulars = session['$$circular'];
        for (let i = 0, l = circulars.length; i < l; i++) {
          const circularValue = circulars[i];
          hasOnInitHook(circularValue) && circularValue.onInit();
        }
        hasOnInitHook(value) && value.onInit();
        // delete session['$$circular'];
      } else if (session.parent) {
        if (Array.isArray(session.parent['$$circular'])) {
          session.parent['$$circular'] = [...session['$$circular'], value, ...session.parent['$$circular']];
        } else {
          session.parent['$$circular'] = [...session['$$circular'], value];
        }
        session.parent['$$startCircular'] = session.parent['$$startCircular'] || session['$$startCircular'];
      }
    } else if (hasOnInitHook(value)) {
      value.onInit();
    }
    return value;
  }
});

export const OnDestroyHook = createWrapper((_: never): WrapperDef => {
  // console.log('onDestroyHook');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside onDestroyHook');
    const value = next(injector, session);
    if (hasOnDestroyHook(value)) {
      // value.onDestroy();
    }
    return value;
  }
});

export function useDefaultHooks(wrapper?: WrapperDef): WrapperDef {
  return OnDestroyHook(OnInitHook(wrapper));
}

/**
 * PRIVATE WRAPPERS
 */

export const Cacheable = createWrapper((_: never): WrapperDef => {
  // console.log('cacheable');

  // cache values in Map maybe is not a good idea
  // if someone uses provider in only one module, then it should be saved only in single variable, not in Map due to memory consumption
  // add the missing logic later
  /**
   * 0 - single cached value (provider is used only in one module/injectors)
   * 1 - multiple cached values (from different modules/injector)
   * 2 - side effects
   * 4 - first run of wrapper, it means first injection
   */
  let flags: 0 | 1 | 2 | 4 = 4;
  let cachedValue: any | Map<Injector, any>;
  let cachedInjector: Injector; 
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside cacheable');
    // if wrappers chain has side effects, then don't cache value
    switch (flags) {
      case 0: {
        // if this same injector, return cached value
        if (injector === cachedInjector) {
          return cachedValue;
        }

        session['$$sideEffects'] = false;
        const value = next(injector, session);
        if (session['$$sideEffects'] === false) {
          // create Map only when given provider has 2 cached values
          const oldValue = cachedValue;
          cachedValue = new Map<Injector, any>();
          (cachedValue as Map<Injector, any>).set(cachedInjector, oldValue);
          (cachedValue as Map<Injector, any>).set(injector, value);
          cachedInjector = undefined;
          flags = 1;
        }
        return value;
      };
      case 1: {
        // value can be null, undefined, 0 or ""
        if ((cachedValue as Map<Injector, any>).has(injector)) {
          return (cachedValue as Map<Injector, any>).get(injector);
        }

        session['$$sideEffects'] = false;
        const value = next(injector, session);
        if (session['$$sideEffects'] === false) {
          (cachedValue as Map<Injector, any>).set(injector, value);
        }
        return value;
      };
      case 2: {
        return next(injector, session);
      };
      case 4: {
        session['$$sideEffects'] = false;
        const value = next(injector, session);
        // if hasn't side effects then cache it
        if (session['$$sideEffects'] === false) {
          flags = 0;
          cachedValue = value;
          cachedInjector = injector;
        } else {
          flags = 2;
        }
        return value;
      }
    }
  }
});

export function useCacheable(wrapper?: WrapperDef): WrapperDef {
  return Cacheable(wrapper);
}
