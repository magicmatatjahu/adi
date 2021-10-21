import { SessionStatus } from "../enums";
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
      // methods are called after resolution due to problem in Cache wrapper (checking if value has `then` function in the `thenable` util) - skip for that below trap
      // TODO: change it
      if (name === 'get' && args[1] === 'then') {
        return;
      }
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

export const Lazy = createWrapper((options: LazyOptions = {}) => {
  const proxy = options.proxy;
  return (session, next) => {
    if (session.status & SessionStatus.DRY_RUN) {
      return next(session);
    }

    if (proxy === true) {
      // works only with objects
      return createProxy(() => {
        return next(session)
      });
    }

    let value: any, resolved = false;
    return () => {
      if (resolved === false) {
        resolved = true;
        // TODO: support async mode
        value = next(session);
      }
      return value;
    };
  }
});
