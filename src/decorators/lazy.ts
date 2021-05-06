// move it to separate file - only for POC

import { Injector } from "../injector";
import { InjectionSession, NextWrapper, WrapperDef, Type } from "../interfaces";
import { createWrapper } from "./inject";

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
