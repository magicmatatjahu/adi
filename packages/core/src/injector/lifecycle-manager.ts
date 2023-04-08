import { ADI } from '../adi';
import { InjectorStatus, InstanceStatus } from '../enums';
import { initHooksMetaKey, destroyHooksMetaKey, circularSessionsMetaKey } from '../private';
import { waitSequence } from '../utils';

import type { Injector, Provider, Session } from '../injector';
import type { ProviderDefinition, ProviderInstance, OnInit, OnDestroy, DestroyContext } from '../interfaces';

function hasOnInitLifecycle(instance: unknown): instance is OnInit {
  return instance && typeof (instance as OnInit).onInit === 'function';
}

function hasOnDestroyLifecycle(instance: unknown): instance is OnDestroy {
  return instance && typeof (instance as OnDestroy).onDestroy === 'function';
}

function handleOnInitLifecycle(session: Session, instance: ProviderInstance) {
  const value = instance.value;
  const hooks: undefined | Array<Function> = session.annotations[initHooksMetaKey];
  if (!hooks) {
    if (hasOnInitLifecycle(value)) {
      return value.onInit();
    }
    return;
  }
  
  delete session.annotations[initHooksMetaKey];
  if (hasOnInitLifecycle(value)) {
    hooks.push(() => value.onInit());
  }

  const injector = session.context.injector;
  ADI.emit('instance:create', { injector, instance })
  return waitSequence(
    hooks.reverse(), 
    hook => hook(session, [value]),
  );
}

export function processOnInitLifecycle(instance: ProviderInstance) {
  const session = instance.session;
  if (session.hasFlag('circular')) { 
    // run only when parent isn't in circular loop
    if (session.parent?.hasFlag('circular')) {
      return;
    }

    const circularSessions = session.annotations[circularSessionsMetaKey] as Array<Session>;
    circularSessions.push(session);
    return waitSequence(circularSessions, (s: Session) => handleOnInitLifecycle(s, s.context.instance));
  }
  return handleOnInitLifecycle(session, instance);
}

export async function processOnDestroyLifecycle(instance: ProviderInstance) {
  const session = instance.session;
  const value = instance.value;
  if (hasOnDestroyLifecycle(value)) {
    await value.onDestroy();
  }
  
  const hooks: undefined | Array<Function> = instance.meta[destroyHooksMetaKey];
  if (!hooks) {
    return;
  }

  delete instance.meta[destroyHooksMetaKey];
  const injector = session.context.injector;
  ADI.emit('instance:destroy', { injector, instance });

  for (let i = 0, l = hooks.length; i < l; i++) {
    await hooks[i](session, [value]);
  }
}

export async function destroy(instance: ProviderInstance, ctx?: DestroyContext): Promise<void>;
export async function destroy(instances: Array<ProviderInstance>, ctx?: DestroyContext): Promise<void>;
export async function destroy(instances: ProviderInstance | Array<ProviderInstance>, ctx?: DestroyContext): Promise<void>;
export async function destroy(instances: ProviderInstance | Array<ProviderInstance>, ctx: DestroyContext = { event: 'default' }): Promise<void> {
  if (Array.isArray(instances)) {
    return destroyCollection(instances, ctx);
  }
  return destroyInstance(instances, ctx);
}

async function destroyInstance(instance: ProviderInstance, ctx: DestroyContext) {
  if (!instance || (instance.status & InstanceStatus.DESTROYED)) {
    return;
  }

  const { kind, options } = instance.scope;
  const shouldDestroy = await kind.shouldDestroy(instance, options, ctx) || shouldForceDestroy(instance);

  if (!shouldDestroy) {
    return;
  }
  instance.status |= InstanceStatus.DESTROYED;
  instance.definition.values.delete(instance.context);
  
  await processOnDestroyLifecycle(instance);
  return destroyChildren(instance, ctx);
}

async function destroyCollection(instances: Array<ProviderInstance> = [], ctx: DestroyContext) {
  if (!instances.length) return;
  return waitSequence(instances, instance => destroyInstance(instance, ctx));
}

export function destroyRecord(record: Provider, ctx?: DestroyContext) {
  const injector = record.host;
  const defs = record.defs;
  record.defs = [];
  return waitSequence(defs, def => destroyDefinition(injector, def, ctx))
}

export function destroyDefinition(injector: Injector, definition: ProviderDefinition, ctx?: DestroyContext) {
  ADI.emit('provider:destroy', { injector, definition });

  const instances = Array.from(definition.values.values());
  definition.values = new Map();
  instances.forEach(instance => {
    instance.status |= InstanceStatus.DEFINITION_DESTROYED;
  });
  return destroyCollection(instances, ctx);
}

function destroyChildren(instance: ProviderInstance, ctx: DestroyContext) {
  const children = instance.session.children.map(s => s.context.instance);

  children.forEach(child => child.parents?.delete(instance));
  if (instance.links) {
    children.push(...Array.from(instance.links));
  }

  return destroyCollection(children, ctx);
}

function shouldForceDestroy(instance: ProviderInstance) {
  const { status, parents } = instance;
  const parentsSize = parents?.size;
  return (
    // Definition destroyed case
    ((status & InstanceStatus.DEFINITION_DESTROYED) && !parentsSize) ||
    // Circular injection case
    ((status & InstanceStatus.CIRCULAR) && (parentsSize === 1))
  );
}

export async function destroyInjector(injector: Injector) {
  if (injector.status & InjectorStatus.DESTROYED) return; 
  injector.status |= InjectorStatus.DESTROYED;

  // get only self providers
  const providers = Array.from(injector.providers.values())
    .map(r => r.self).filter(Boolean);

  injector.providers.clear();
  await waitSequence(providers, provider => destroyRecord(provider, { event: 'injector' }));

  // remove injector from parent imports
  if (injector.parent !== null) {
    injector.parent.imports.delete(injector.input);
  }

  // then destroy and clean all imported modules
  const injectors = Array.from(injector.imports.values());
  injector.imports.clear();
  return waitSequence(injectors, destroyInjector);
}
