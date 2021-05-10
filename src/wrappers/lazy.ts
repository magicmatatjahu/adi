import { Injector } from "../injector";
import { InjectionSession, NextWrapper, WrapperDef } from "../interfaces";
import { createWrapper } from "../utils";

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