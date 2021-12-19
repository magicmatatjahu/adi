import {
  TTarget,
  TProxy,
  TProxyFactory,
  TTrapName,
  TTraps,
  THandlerContext,
  TProxyHandler,
  TTrapContext,
  TProxyFactoryThis,
  TProxyFactoryOptions,
  DeepProxyConstructor,
} from './interface'

import { addToCache, getFromCache } from './cache'

export const DEFAULT = Symbol('default')

const trapNames = Object.keys(
  Object.getOwnPropertyDescriptors(Reflect),
) as Array<TTrapName>

const trapsWithKey = [
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
]

const createHandlerContext = <T>(
  trapContext: TTrapContext,
  target: T,
  prop?: keyof T,
  val?: any,
  receiver?: any,
): THandlerContext<T> => {
  const args = [target, prop, val, receiver]
  const { trapName, handler, traps, root, path } = trapContext
  const key = trapsWithKey.includes(trapName) ? prop : undefined
  const newValue = trapName === 'set' ? val : undefined

  // prettier-ignore
  return {
    target,
    trapName,
    traps,
    args,
    path,
    handler,
    key,
    newValue,
    root,
    get proxy() { return getFromCache(root, target, path) as TProxy<T>  },
    get value() { return key && target[key] },
    DEFAULT,
    PROXY: createDeepProxy.bind({ root, handler, path: [...path, key as string] }),
  }
}

const trap = function <T extends TTarget>(
  this: TTrapContext,
  target: T,
  prop?: keyof T,
  val?: any,
  receiver?: any,
) {
  const { trapName, handler } = this
  const handlerContext = createHandlerContext(this, target, prop, val, receiver)
  const { PROXY, DEFAULT } = handlerContext
  const result = handler(handlerContext)

  if (result === PROXY) {
    return PROXY(handlerContext.value as TTarget)
  }

  if (result === DEFAULT) {
    // eslint-disable-next-line
    // @ts-ignore
    return Reflect[trapName](target as TTarget & Function, prop, val, receiver)
  }

  return result
}

const createTraps = (handler: TProxyHandler, root: TTarget, path: string[]) =>
  trapNames.reduce<TTraps>((traps, trapName) => {
    traps[trapName] = trap.bind({
      trapName,
      handler,
      traps,
      root,
      path,
    })
    return traps
  }, {})

const checkTarget = (target: any): void => {
  if (
    target === null ||
    (typeof target !== 'object' && typeof target !== 'function')
  ) {
    throw new TypeError(
      'Deep proxy could be applied to objects and functions only',
    )
  }
}

export const defaultProxyHandler: TProxyHandler = ({ DEFAULT }) => DEFAULT

export const createDeepProxy: TProxyFactory = function <T extends TTarget>(
  this: TProxyFactoryThis | void,
  target: T,
  handler?: TProxyHandler,
  {
    path,
    root,
    cache,
  }: TProxyFactoryOptions = {}
) {
  checkTarget(target)

  const _this: TProxyFactoryThis = { ...this }
  const _handler = handler || _this.handler || defaultProxyHandler
  const _path = path || _this.path || []
  const _root = _this.root || root || target

  if (cache) {
    const _proxy = getFromCache(_root, target, _path);
    if (_proxy) return _proxy;
  }

  const traps = createTraps(_handler, _root, _path)
  const proxy = new Proxy(target, traps)

  addToCache(_root, target, _path, traps, proxy)

  return proxy
}

export const DeepProxy = class<T extends TTarget> {
  constructor(
    target: T,
    handler?: TProxyHandler,
    options?: TProxyFactoryOptions
  ) {
    return createDeepProxy(target, handler, options)
  }
} as DeepProxyConstructor