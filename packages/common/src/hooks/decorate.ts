import { Hook, wait, InjectionItem, createCustomResolver } from '@adi/core';
import { injectableDefinitions } from '@adi/core/lib/injector';
import { DELEGATE_KEY, DELEGATE_VALUE } from './delegate';

import type { Session, InjectionHookResult, NextInjectionHook, ClassType, ProviderInstance, CustomResolver } from '@adi/core';

export type DecorateHookOptions<T = any, D = any> = 
  | ClassType<T>
  | DecorateClass<T>
  | ((decorate: D) => T)
  | DecorateFunction<T, D>;

interface DecorateClass<T = any> {
  useClass: ClassType<T>;
  delegationKey?: string | symbol;
}

interface DecorateFunction<T = any, D = any> {
  decorate: (decorated: D, ...args: any[]) => T;
  inject?: Array<InjectionItem>;
}

function hasDecorateClass(decorator: unknown): decorator is DecorateClass {
  return 'useClass' in (decorator as DecorateClass);
}

function hasDecorateFunction(decorator: unknown): decorator is DecorateFunction {
  return typeof (decorator as DecorateFunction).decorate === 'function';
}

// TODO: Move to the Session class  
function reassignSession(original: Session, forked: Session, instance: ProviderInstance) {
  const parent = original.parent;
  if (!parent) {
    return;
  }

  const chilren = parent.children;
  const indexOf = chilren.indexOf(original);
  chilren.splice(indexOf, 1, forked);
  instance.session = forked;
}

// uid is used to avoid redecorate the given instance
let decorationUID = 0;

export const DECORATE_KEY = 'adi:key:decorate';

export function Decorate<NextValue = unknown, T = any>(options: DecorateHookOptions<T, NextValue>) {  
  // decoratorID is added to the every instances with `true` value to avoid redecorate the given instance
  const decorateKey = `adi:key:decorator-${decorationUID++}`;
  let resolver: CustomResolver
  let delegationKey: string | symbol | undefined;
  let isClass: boolean = false;

  if (typeof options === 'function') {
    const definition = injectableDefinitions.get(options);
    if (!definition) { // normal function case
      resolver = createCustomResolver({ kind: 'function', handler: options as ((decorate: any) => any) })
    } else {
      resolver = createCustomResolver({ kind: 'class', class: options as ClassType, asStandalone: true })
      isClass = true;
    }
  } else if (hasDecorateFunction(options)) { // function based decorator
    resolver = createCustomResolver({ kind: 'function', handler: options.decorate, inject: options.inject });
  } else if (hasDecorateClass(options)) {
    resolver = createCustomResolver({ kind: 'class', class: options.useClass, asStandalone: true })
    delegationKey = options.delegationKey;
    isClass = true;
  }
  delegationKey = delegationKey || DECORATE_KEY;

  return Hook(
    function decorateHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<T> {
      if (session.hasFlag('dry-run')) {
        return next(session) as T;
      }
  
      // fork session and resolve the original value
      const forked = session.fork();
      return wait(
        next(session),
        decorated => {
          const sessionInstance = session.instance;
          if (!sessionInstance) {
            return;
          }
  
          const sessionInstanceMeta = sessionInstance.meta;
          // if it has been decorated before, return value.
          if (sessionInstanceMeta[decorateKey]) {
            return decorated;
          }
  
          const data = forked.data;
          (data[DELEGATE_VALUE] = [] as any[]).push(decorated);
          if (delegationKey) { // classType based decorator
            if (data[DELEGATE_KEY]) {
              data[DELEGATE_KEY][delegationKey] = decorated;
            } else {
              data[DELEGATE_KEY] = {
                [delegationKey]: decorated,
              }
            }
          }
  
          const parent = forked.parent;
          if (parent) {
            parent.children.push(forked);
          }
          
          // resolve decorator and save decorated value to the instance value
          return wait(
            resolver(forked, decorated),
            value => {
              // possible async resolution
              if (sessionInstanceMeta[decorateKey]) {
                return value;
              }
  
              sessionInstanceMeta[decorateKey] = true;
              if (isClass) {
                reassignSession(session, forked, sessionInstance);
              }
  
              // redeclare instance value to save decorated value
              return sessionInstance.value = value;
            }
          )
        }
      ) as T;
    },
    { name: 'adi:decorate' }
  )
}
