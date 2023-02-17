import { createHook, InjectionMetadata } from '@adi/core';
import { Reflection } from '@adi/core/lib/utils';
import { DELEGATE_KEY, DELEGATE_VALUE } from './delegate';

import type { Session, ClassType } from '@adi/core';

const uRef = {}; // fallback for undefined, null, '', false, 0

function retrieveDelegationByKey(session: Session, key: string | symbol | number) {
  const delegations = session.annotations[DELEGATE_KEY];
  if (delegations && delegations.hasOwnProperty(key)) {
    return delegations[key];
  }

  const parent = session.parent;
  if (!parent) {
    return uRef;
  }
  return retrieveDelegationByKey(parent, key);
}

function retrieveReflectedType(metadata: InjectionMetadata): Object {
  const { target, index, key } = metadata;
  if (typeof key !== 'undefined') {
    if (typeof index === 'number') {
      return Reflection.getOwnMetadata("design:paramtypes", (target as ClassType).prototype, key)[index];
    }
    return Reflection.getOwnMetadata("design:type", (target as ClassType).prototype, key);
  }
  return Reflection.getOwnMetadata("design:paramtypes", target)[index];
}

function isInstanceOf(value: any, type: Object) {
  return Object.getPrototypeOf(value).constructor === type;
}

function retrieveDelegationByReflectedType(session: Session, reflectedType: Object) {
  const delegations = session.annotations[DELEGATE_VALUE];
  const instance = delegations && delegations.find((d: any) => isInstanceOf(d, reflectedType));
  if (instance) {
    return instance;
  }

  const parent = session.parent;
  if (!parent) {
    return uRef;
  }
  return retrieveDelegationByReflectedType(parent, reflectedType);
}

export const Delegation = createHook((key?: string | symbol | number) => {
  key = typeof key === 'number' ? String(key) : key;
  const hasKey = typeof key !== 'undefined';

  return function(session, next) {
    if (session.hasFlag('dry-run')) {
      return next(session);
    }

    let delegation: any;
    if (hasKey) {
      delegation = retrieveDelegationByKey(session, key);
    } else {
      const reflectedType = retrieveReflectedType(session.iMetadata);
      delegation = retrieveDelegationByReflectedType(session, reflectedType);
    }

    if (delegation === uRef) {
      return next(session);
    }

    session.setFlag('side-effect');
    return delegation;
  }
}, { name: "adi:hook:delegation" });
