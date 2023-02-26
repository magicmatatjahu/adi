// source https://github.com/samvv/js-proxy-deep/blob/master/package/index.js

export interface DeepProxyHandler<T extends object> {
  getPrototypeOf? (this: TrapThisArgument<T>, target: T): object | null;
  setPrototypeOf? (this: TrapThisArgument<T>, target: T, v: any): boolean;
  isExtensible? (this: TrapThisArgument<T>, target: T): boolean;
  preventExtensions? (this: TrapThisArgument<T>, target: T): boolean;
  getOwnPropertyDescriptor? (this: TrapThisArgument<T>, target: T, p: PropertyKey): PropertyDescriptor | undefined;
  has? (this: TrapThisArgument<T>, target: T, p: PropertyKey): boolean;
  get? (this: TrapThisArgument<T>, target: T, p: PropertyKey, receiver: any): any;
  set? (this: TrapThisArgument<T>, target: T, p: PropertyKey, value: any, receiver: any): boolean;
  deleteProperty? (this: TrapThisArgument<T>, target: T, p: PropertyKey): boolean;
  defineProperty? (this: TrapThisArgument<T>, target: T, p: PropertyKey, attributes: PropertyDescriptor): boolean;
  enumerate? (this: TrapThisArgument<T>, target: T): PropertyKey[];
  ownKeys? (this: TrapThisArgument<T>, target: T): PropertyKey[];
  apply? (this: TrapThisArgument<T>, target: T, thisArg: any, argArray?: any): any;
  construct? (this: TrapThisArgument<T>, target: T, argArray: any, newTarget?: any): object;
}

export interface DeepProxyOptions {
  path?: string[];
  data?: Record<string | symbol, any>;
}

export interface DeepProxyConstructor {
  new <T extends object>(target: T, handler: DeepProxyHandler<T>, options?: DeepProxyOptions): T;
}

export interface TrapThisArgument<T extends object> {
  nest(value?: any): object;
  path: string[];
  rootTarget: T; 
}

function parsePath(path: string) {
  return path.split('.');
}

function push(arr: Array<any>, element: any) {
  const newArr = arr.slice(); // copy array
  newArr.push(element);
  return newArr;
}

// names of the traps that can be registered with ES6's Proxy object
const trapNames = [
  'apply',
  'construct',
  'defineProperty',
  'deleteProperty',
  'enumerate',
  'get',
  'getOwnPropertyDescriptor',
  'getPrototypeOf',
  'has',
  'isExtensible',
  'ownKeys',
  'preventExtensions',
  'set',
  'setPrototypeOf',
]

// a list of paramer indexes that indicate that the a recieves a key at that parameter
// this information will be used to update the path accordingly
const keys = {
  get: 1,
  set: 1,
  deleteProperty: 1,
  has: 1,
  defineProperty: 1,
  getOwnPropertyDescriptor: 1,
}

export const DeepProxy: DeepProxyConstructor = function<T extends object>(rootTarget: T, traps: DeepProxyHandler<T>, options?: DeepProxyOptions): T {
  let path = [];
  let data = {};

  if (options) {
    if (typeof options.path !== 'undefined') {
      path = options.path;
    }
    if (typeof options.data !== 'undefined') {
      data = options.data;
    }
  }

  function createProxy(target: T, path: string[]) {
    // avoid creating a new object between two traps
    const context: TrapThisArgument<T> = { rootTarget, path } as TrapThisArgument<T>;
    Object.assign(context, data);

    const realTraps = {};
    for (const trapName of trapNames) {
      const keyParamIdx = keys[trapName];
      const trap = traps[trapName];

      if (typeof trap !== 'undefined') {
        if (typeof keyParamIdx !== 'undefined') {
          realTraps[trapName] = function () {
            const key = arguments[keyParamIdx];
            // update context for this trap
            context.nest = function (nestedTarget) {
              if (nestedTarget === undefined) {
                nestedTarget = rootTarget;
              }
              return createProxy(nestedTarget, push(path, key)); 
            }
            return trap.apply(context, arguments);
          }
        } else {
          realTraps[trapName] = function () {
            // update context for this trap
            context.nest = function (nestedTarget) {
              if (nestedTarget === undefined) {
                nestedTarget = {};
              }
              return createProxy(nestedTarget, path);
            }
            return trap.apply(context, arguments);
          }
        }
      }
    }

    return new Proxy(target, realTraps);
  }

  return createProxy(rootTarget, path);
} as unknown as DeepProxyConstructor;
