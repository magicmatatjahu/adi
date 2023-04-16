import { createHook, wait, InjectionItem, createFunction } from '@adi/core';
import { injectableDefinitions } from '@adi/core/lib/injector';
import { resolverClass } from '@adi/core/lib/injector/resolver';
import { DELEGATE_KEY, DELEGATE_VALUE } from './delegate';

import type { Session, ClassType, ProviderInstance } from '@adi/core';

export type DecorateHookOptions = 
  | ClassType
  | DecorateClass
  | ((decorate: any) => any)
  | DecorateFunction;

interface DecorateClass {
  class: ClassType;
  delegationKey?: string | symbol;
}

interface DecorateFunction<T = any> {
  decorate: (decorated: T, ...args: any[]) => any;
  inject?: Array<InjectionItem>;
}

function hasDecorateClass(decorator: unknown): decorator is DecorateClass {
  return 'class' in (decorator as DecorateClass);
}

function hasDecorateFunction(decorator: unknown): decorator is DecorateFunction {
  return typeof (decorator as DecorateFunction).decorate === 'function';
}

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

// uniqueID is used to avoid redecorate the given instance
let uniqueID = 0;

export const DECORATE_KEY = 'adi:key:decorate';

export const Decorate = createHook((options: DecorateHookOptions) => {
  // decoratorID is added to the every instances with `true` value to avoid redecorate the given instance
  const decorateKey = `adi:key:decorator-${uniqueID++}`;
  let resolver: ReturnType<typeof createFunction>;
  let delegationKey: string | symbol | undefined;
  let isClass: boolean = false;

  if (typeof options === 'function') {
    const definition = injectableDefinitions.get(options);
    if (!definition) { // normal function case
      resolver = (_, [value]) => (options as ((decorate: any) => any))(value);
    } else {
      resolver = (session) => resolverClass(session.context.injector, session, { class: options as ClassType, inject: definition.injections });
      isClass = true;
    }
  } else if (hasDecorateFunction(options)) { // function based decorator
    resolver = createFunction(options.decorate, options.inject || []);
  } else if (hasDecorateClass(options)) {
    const clazz = options.class;
    const definition = injectableDefinitions.ensure(clazz);
    resolver = (session) => resolverClass(session.context.injector, session, { class: clazz, inject: definition.injections });
    delegationKey = options.delegationKey;
    isClass = true;
  }
  delegationKey = delegationKey || DECORATE_KEY;

  return (session, next) => {
    if (session.hasFlag('dry-run')) {
      return next(session);
    }

    // fork session and resolve the original value
    const forked = session.fork();
    return wait(
      next(session),
      decorated => {
        const sessionInstance = session.context.instance;

        // if it has been decorated before, return value.
        if (sessionInstance.meta[decorateKey]) {
          return decorated;
        }

        const annotations = forked.annotations;
        (annotations[DELEGATE_VALUE] = []).push(decorated);
        if (delegationKey) { // classType based decorator
          if (annotations[DELEGATE_KEY]) {
            annotations[DELEGATE_KEY][delegationKey] = decorated;
          } else {
            annotations[DELEGATE_KEY] = {
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
          resolver(forked, [decorated]),
          value => {
            // possible problem with async resolution - check again
            if (sessionInstance.meta[decorateKey]) {
              return value;
            }

            sessionInstance.meta[decorateKey] = true;
            if (isClass) {
              reassignSession(session, forked, sessionInstance);
            }

            // redeclare instance value to save decorated value
            return sessionInstance.value = value;
          }
        )
      }
    );
  }
}, { name: "adi:hook:decorate" });
