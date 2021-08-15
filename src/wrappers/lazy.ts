import { WrapperDef } from "../interfaces";
import { createWrapper } from "../utils";

interface LazyOptions {
  proxy?: boolean;
}

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
  let value: T, init = false;
  const delayedObject: () => T = (): T => {
    if (init === false) {
      value = createObject();
      init = true;
    }
    return value;
  };
  return new Proxy<any>({} as object, createHandler(delayedObject)) as T;
}

function wrapper({ proxy }: LazyOptions = {}): WrapperDef {
  return (injector, session, next) => {
    if (proxy === true) {
      // works only with objects
      return createProxy(() => next(injector, session));
    }

    let value: any, resolved = false;
    return () => {
      if (resolved === false) {
        value = next(injector, session);
        resolved = true;
      }
      return value;
    };
  }
}

export const Lazy = createWrapper(wrapper);
