import { wait, waitSequentially } from "./wait";
import { SessionFlag } from "../enums";

import type { Session } from "../injector";
import type { ProviderInstance, OnDestroy, OnInit } from "../interfaces";

const circularSessionsMetaKey = 'adi:circular-sessions';

function hasOnInitLifecycle(instance: unknown): instance is OnInit {
  return instance && typeof (instance as OnInit).onInit === 'function';
}

export const initHooksMetaKey = 'adi:lifecycle:on-init';
function _handleOnInitLifecycle(session: Session, instance: ProviderInstance) {
  const value = instance.value;
  const hooks = (session.meta[initHooksMetaKey]) as undefined | Array<Function>;
  if (!hooks) {
    return hasOnInitLifecycle(value) && value.onInit();
  }
  delete session.meta[initHooksMetaKey];
  hasOnInitLifecycle(value) && hooks.push(() => value.onInit());
  return waitSequentially(hooks.reverse(), hook => hook(value));
}

export function handleOnInitLifecycle(session: Session, instance: ProviderInstance) {
  if (session.hasFlag(SessionFlag.CIRCULAR)) { 
    if (!(session.parent?.hasFlag(SessionFlag.CIRCULAR))) { // run only when parent isn't in circular loop
      const sessions = session.meta[circularSessionsMetaKey];
      delete session.meta[circularSessionsMetaKey];
      return waitSequentially(sessions, (s: Session) => _handleOnInitLifecycle(s, s.ctx.instance));
    }
    return;
  }
  return _handleOnInitLifecycle(session, instance);
}

function hasOnDestroyLifecycle(instance: unknown): instance is OnDestroy {
  return instance && typeof (instance as OnDestroy).onDestroy === 'function';
}

export const destroyHooksMetaKey = 'adi:lifecycle:on-destroy';
export async function handleOnDestroyLifecycle(instance: ProviderInstance) {
  const value = instance.value;
  hasOnDestroyLifecycle(value) && await value.onDestroy();
  const hooks = (instance.meta[destroyHooksMetaKey]) as Array<Function>;
  if (!hooks) return;
  delete instance.meta[destroyHooksMetaKey];
  for (let i = 0, l = hooks.length; i < l; i++) {
    await hooks[i](value);
  }
}
