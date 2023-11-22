import { InjectorStatus, InstanceStatus } from '../enums';
import { initHooksMetaKey, destroyHooksMetaKey, circularSessionsMetaKey, scopedInjectorLabelMetaKey, scopedInjectorsMetaKey } from '../private';
import { waitSequence, hasOnInitLifecycle, hasOnDestroyLifecycle } from '../utils';

import type { Injector, Session } from '../injector';
import type { ProviderRecord, ProviderDefinition, ProviderInstance, DestroyContext, CustomResolver } from '../types';

const resolvedInstances = new WeakMap<object, ProviderInstance>();
const defaultDestroyCtx: DestroyContext = { event: 'default' }

export function processOnInitLifecycle(instance: ProviderInstance) {
  const session = instance.session;
  if (session.hasFlag('circular')) { 
    // run only when parent isn't in circular loop
    if (session.parent?.hasFlag('circular')) {
      return;
    }

    const circularSessions = session.annotations[circularSessionsMetaKey] as Array<Session>;
    circularSessions.push(session);
    return waitSequence(circularSessions, (s: Session) => handleOnInitLifecycle(s, s.context.instance!));
  }
  return handleOnInitLifecycle(session, instance);
}

function handleOnInitLifecycle(session: Session, instance: ProviderInstance) {
  const { annotations, context } = session;
  const emitter = context.injector.emitter;
  const value = instance.value;

  // assign resolved value to provider instance for future destroying
  if (typeof value === 'object' && value) {
    resolvedInstances.set(value, instance)
  }

  const hooks: undefined | Array<CustomResolver> = annotations[initHooksMetaKey];
  if (!hooks) {
    emitter.emit('instance:create', { session, instance })
    if (hasOnInitLifecycle(value)) {
      return value.onInit();
    }
    return;
  }
  
  delete annotations[initHooksMetaKey];
  if (hasOnInitLifecycle(value)) {
    hooks.push(() => value.onInit());
  }

  emitter.emit('instance:create', { session, instance });
  return waitSequence(
    hooks.reverse(), 
    hook => hook(session, value),
  );
}

async function processOnDestroyLifecycle(instance: ProviderInstance, ctx: DestroyContext) {
  const { session, value } = instance;

  if (ctx.event !== 'dispose' && value) {
    value[Symbol.dispose]?.();
    await value[Symbol.asyncDispose]?.();
  }

  if (hasOnDestroyLifecycle(value)) {
    await value.onDestroy();
  }
  
  const meta = instance.meta;
  const hooks: undefined | Array<CustomResolver> = meta[destroyHooksMetaKey];
  if (!hooks) {
    return;
  }

  delete meta[destroyHooksMetaKey];
  const emitter = session.context.injector.emitter;
  emitter.emit('instance:destroy', { session, instance });

  for (let i = 0, l = hooks.length; i < l; i++) {
    await hooks[i](session, value);
  }
}

export async function destroy(instance: any, ctx?: DestroyContext): Promise<void>;
export async function destroy(instance: ProviderInstance, ctx?: DestroyContext): Promise<void>;
export async function destroy(instances: Array<ProviderInstance>, ctx?: DestroyContext): Promise<void>;
export async function destroy(instance: ProviderInstance | Array<ProviderInstance> | any, ctx: DestroyContext = defaultDestroyCtx): Promise<void> {
  const possibleInstance = resolvedInstances.get(instance)
  if (possibleInstance) {
    return destroyInstance(possibleInstance, ctx);
  }

  if (Array.isArray(instance)) {
    return destroyCollection(instance, ctx);
  }

  return destroyInstance(instance, ctx);
}

const disposeDestroyCtx: DestroyContext = { event: 'dispose' };
export function applyDisposableInterfaces(target: object) {
  const originalDispose = target[Symbol.dispose] as (() => void) | undefined
  target[Symbol.dispose] = function() {
    originalDispose?.call(this)
    destroy(this, disposeDestroyCtx);
  }

  const originalAsyncDispose = target[Symbol.asyncDispose] as (() => Promise<void>) | undefined
  target[Symbol.asyncDispose] = async function() {
    await originalAsyncDispose?.call(this)
    await destroy(this, disposeDestroyCtx);
  }
}

async function destroyInstance(instance: ProviderInstance, ctx: DestroyContext) {
  if (!instance || (instance.status & InstanceStatus.DESTROYED)) {
    return;
  }

  const { scope: { scope, options }, definition, context } = instance;
  const shouldDestroy = await scope!.shouldDestroy(instance, options, ctx) || shouldForceDestroy(instance);
  if (!shouldDestroy) {
    return;
  }

  instance.status |= InstanceStatus.DESTROYED;
  definition.values.delete(context);
  
  await processOnDestroyLifecycle(instance, ctx);
  return destroyChildren(instance, ctx);
}

async function destroyCollection(instances: Array<ProviderInstance> = [], ctx: DestroyContext) {
  return waitSequence(instances, instance => destroyInstance(instance, ctx));
}

export function destroyProvider(provider: ProviderRecord, ctx: DestroyContext) {
  const injector = provider.host;
  const defs = provider.defs;
  provider.defs = [];
  return waitSequence(defs, def => destroyDefinition(injector, def, ctx))
}

export function destroyDefinition(injector: Injector, definition: ProviderDefinition, ctx: DestroyContext) {
  injector.emitter.emit('provider:destroy', { definition });

  const instances = Array.from(definition.values.values());
  definition.values = new Map();
  instances.forEach(instance => {
    instance.status |= InstanceStatus.DEFINITION_DESTROYED;
  });
  return destroyCollection(instances, ctx);
}

function destroyChildren(instance: ProviderInstance, ctx: DestroyContext) {
  const children = instance.session.children.map(s => s.context.instance!);

  children.forEach(child => child?.parents?.delete(instance));
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

export async function destroyInjector(injector: Injector, ctx: { event: 'manually' | 'default' } = { event: 'default' }) {
  const { meta } = injector;
  const scopedLabel = meta[scopedInjectorLabelMetaKey];
  const isScoped = scopedLabel !== undefined

  if (ctx.event === 'default' && isScoped) {
    return;
  }

  if (injector.status & InjectorStatus.DESTROYED) return; 
  injector.status |= InjectorStatus.DESTROYED;
  injector.emitter.emit('module:destroy', {});

  // get only self providers
  const providers = Array.from(injector.providers.values())
    .map(r => r.self).filter(Boolean) as ProviderRecord[];

  // destroy self providers and clean all providers 
  injector.providers.clear();
  await waitSequence(providers, provider => destroyProvider(provider, { event: 'injector' }));

  const parent = injector.parent as Injector
  if (parent) {
    // remove injector from parent imports
    parent.imports.delete(injector.input);

    // remove (optional) injector from parent scoped injectors
    if (isScoped) {
      parent.meta[scopedInjectorsMetaKey].delete(scopedLabel);
    }
  }

  const scopedInjectors = meta[scopedInjectorsMetaKey];
  if (scopedInjectors) {
    const injectors: Injector[] = Array.from(scopedInjectors.values());
    await waitSequence(injectors, inj => destroyInjector(inj, { event: 'manually' }));
  }

  // then destroy and clean all imported modules
  const injectors = Array.from(injector.imports.values());
  injector.imports.clear();
  await waitSequence(injectors, inj => destroyInjector(inj, { event: 'manually' }));
}
