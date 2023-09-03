import { Hook } from '@adi/core';
import { Reflection } from '@adi/core/lib/utils';
import { DELEGATE_KEY, DELEGATE_VALUE } from './delegate';

import type { Session, InjectionHookResult, NextInjectionHook, ClassType, InjectionMetadata } from '@adi/core';

const falsyRef = {}; // fallback for undefined, null, '', false, 0

function retrieveDelegationByKey(session: Session, key: string | symbol | number) {
  const delegations = session.annotations[DELEGATE_KEY];
  if (delegations && delegations.hasOwnProperty(key)) {
    return delegations[key];
  }

  const parent = session.parent;
  if (!parent) {
    return falsyRef;
  }
  return retrieveDelegationByKey(parent, key);
}

function retrieveReflectedType(metadata: InjectionMetadata): Object | undefined {
  const { target, index, key } = metadata;
  if (typeof key !== 'undefined') {
    if (typeof index === 'number') {
      return Reflection.getOwnMetadata("design:paramtypes", (target as ClassType).prototype, key)[index];
    }
    return Reflection.getOwnMetadata("design:type", (target as ClassType).prototype, key);
  }

  if (target && typeof index === 'number') {
    return Reflection.getOwnMetadata("design:paramtypes", target)[index];
  }
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
    return falsyRef;
  }
  return retrieveDelegationByReflectedType(parent, reflectedType);
}

export function Delegation<NextValue>(key?: string | symbol | number) {
  key = typeof key === 'number' ? String(key) : key;

  return Hook(
    function delegationHook(session: Session, next: NextInjectionHook<NextValue>): InjectionHookResult<NextValue> {
      if (session.hasFlag('dry-run')) {
        return next(session);
      }
  
      let delegation: any;
      if (key === undefined) {
        const reflectedType = retrieveReflectedType(session.metadata);
        delegation = reflectedType && retrieveDelegationByReflectedType(session, reflectedType);
      } else {
        delegation = retrieveDelegationByKey(session, key);
      }
  
      if (delegation === falsyRef) {
        return next(session);
      }
  
      session.setFlag('side-effect');
      return delegation;
    },
    { name: 'adi:delegation' }
  )
}
