import { wait, Scope, createHook } from "@adi/core";
import { InstanceStatus } from '@adi/core/lib/enums';
import { DYNAMIC_CONTEXT } from '../constants';
import { DeepProxy } from '../utils';

import type { Session, Context, ProviderDefinition, ProviderInstance, DestroyContext } from '@adi/core';

export abstract class DynamicScope<O = any> extends Scope<O> {
  // override getContext(session: Session<any>, options: O): Context {
    
  // }

  protected getDynamicContext(session: Session) {
  }

  override shouldDestroy(_: ProviderInstance<any>, __: O, context: DestroyContext): boolean {
    return context.event === 'manually' || context.event === 'injector';
  }

  protected applyDynamicContext(session: Session) {
    let parent = session.parent;
    if (!parent || parent.hasFlag('dynamic-scope')) {
      return;
    }

    const proxy = {};
    const scopeData = { scope: this, proxy, session };
    setDynamicInstance(session.context.definition, proxy);
    while (parent) {
      parent.setFlag('dynamic-scope');
      const meta = parent.meta;
      const scopes = meta[dynamicScopeMetaKey] = meta[dynamicScopeMetaKey] || (meta[dynamicScopeMetaKey] = new Map());
      scopes.set(proxy, scopeData);
      parent = parent.parent;
    }
    return DYNAMIC_CONTEXT;
  }
}

const dynamicScopeMetaKey = 'adi:key:dynamic-scope';
const dynamicScopeValue = {};

export function setDynamicInstance(definition: ProviderDefinition, value: any): void {
  const values = definition.values;
  if (values.has(DYNAMIC_CONTEXT)) {
    return;
  }

  values.set(DYNAMIC_CONTEXT, {
    definition,
    context: DYNAMIC_CONTEXT,
    value,
    status: InstanceStatus.RESOLVED,
    scope: definition.scope,
    session: null,
    parents: undefined,
    links: undefined,
    meta: dynamicScopeValue,
  });
}

export const DynamicScopeHook = createHook(() => {
  return (session, next) => {
    return wait(
      next(session),
      value => {
        if (session.hasFlag('dynamic-scope')) {
          return createDynamicScopeProxy(value, session);
        }
        return value;
      }
    )
  }
}, { name: 'adi:hook:dynamic-scope' });

export function runInDynamicScope() {

}

export function createDynamicScopeProxy(value: any, session: Session) {
  return new DeepProxy(value, {
    // apply(_, thisArg, argArray) {
    //     return getProvider().apply(thisArg, argArray);
    // },
    get(_, prop) {
      const v = value[prop];
      console.log(v);
      if (v === dynamicScopeValue) {
        console.log(v);
      }
      return v;
    },
    set(_, prop, value) {
      return (value[prop] = value);
    },
    ownKeys() {
      return Reflect.ownKeys(value);
    },
    getPrototypeOf() {
      return Reflect.getPrototypeOf(value);
    },
    getOwnPropertyDescriptor(_, prop) {
      return Reflect.getOwnPropertyDescriptor(value, prop);
    },
    has(_, prop) {
      return Reflect.has(value, prop);
    },
  });
}

function createDynamicInstances() {

}

function createDynamicInstance() {

}
