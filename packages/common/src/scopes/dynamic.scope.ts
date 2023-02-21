import { Scope } from "@adi/core";

import type { Context, Session } from '@adi/core';

export function applyDynamicScope(session: Session) {
  let parent = session.parent;
  if (parent.hasFlag('dynamic-scope')) {
    return;
  }

  while (parent) {
    parent.setFlag('dynamic-scope');
    parent = parent.parent;
  }
}

// export function createDynamicScopeProxy(){
//   return new Proxy(() => null, {
//     apply(_, thisArg, argArray) {
//         return getProvider().apply(thisArg, argArray);
//     },
//     get(_, prop) {
//         return getProvider()[prop];
//     },
//     set(_, prop, value) {
//         return (getProvider()[prop] = value);
//     },
//     ownKeys() {
//         return Reflect.ownKeys(getProvider());
//     },
//     getPrototypeOf() {
//         return Reflect.getPrototypeOf(getProvider());
//     },
//     getOwnPropertyDescriptor(_, prop) {
//         return Reflect.getOwnPropertyDescriptor(getProvider(), prop);
//     },
//     has(_, prop) {
//         return Reflect.has(getProvider(), prop);
//     },
//   });
// }

export abstract class DynamicScope<O> extends Scope<O> {
  override create(session: Session<any>, options: O) {
    
  }

  protected assignAnnotations(session: Session) {
    let parent = session.parent;
    if (parent.hasFlag('dynamic-scope')) {
      return;
    }

    while (parent) {
      parent.setFlag('dynamic-scope');
      parent = parent.parent;
    }
  }
}
