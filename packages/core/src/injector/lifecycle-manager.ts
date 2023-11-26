import { resolvedInstances } from './provider';
import { dynamicContexts } from './dynamic-context';
import { InjectorStatus, InstanceStatus } from '../enums';
import { initHooksMetaKey, destroyHooksMetaKey, disposePatchedMetaKey, circularSessionsMetaKey, scopedInjectorLabelMetaKey, scopedInjectorsMetaKey, dynamicContextMetaKey } from '../private';
import { waitSequence, hasOnInitLifecycle, hasOnDestroyLifecycle } from '../utils';

import type { Injector } from './injector';
import type { ProviderRecord, ProviderDefinition, ProviderInstance } from './provider';
import type { Session } from './session';
import type { DestroyContext, InjectorDestroyContext, CustomResolver, OnDestroyOptions } from '../types';

const defaultDestroyCtx: DestroyContext = { event: 'default' }
const defaultinjectorDestroyCtx: InjectorDestroyContext = { event: 'default' }

export function processOnInitLifecycle(instance: ProviderInstance) {
  const session = instance.session;
  if (session.hasFlag('circular')) { 
    // run only when parent isn't in circular loop
    if (session.parent?.hasFlag('circular')) {
      return;
    }

    const circularSessions = session.annotations[circularSessionsMetaKey] as Array<Session>;
    circularSessions.push(session);
    return waitSequence(circularSessions, (s: Session) => handleOnInitLifecycle(s, s.instance!));
  }
  return handleOnInitLifecycle(session, instance);
}

function handleOnInitLifecycle(session: Session, instance: ProviderInstance) {
  const emitter = session.injector.emitter;
  const value = instance.value;

  const hooks: undefined | Array<CustomResolver> = session.annotations[initHooksMetaKey] || [];
  if (!hooks) {
    emitter.emit('instance:create', { session, instance })
    if (hasOnInitLifecycle(value)) {
      return value.onInit();
    }
    return;
  }
  
  delete session.annotations[initHooksMetaKey];
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
  const emitter = session.injector.emitter;
  emitter.emit('instance:destroy', { session, instance });

  for (let i = 0, l = hooks.length; i < l; i++) {
    await hooks[i](session, value);
  }
}

export async function destroy(instance: any, ctx?: DestroyContext): Promise<void>;
export async function destroy(instance: ProviderInstance, ctx?: DestroyContext): Promise<void>;
export async function destroy(instances: Array<ProviderInstance>, ctx?: DestroyContext): Promise<void>;
export async function destroy(instance: ProviderInstance | Array<ProviderInstance>, ctx: DestroyContext = defaultDestroyCtx): Promise<void> {
  const possibleInstance = resolvedInstances.get(instance)
  if (possibleInstance) {
    return destroyInstance(possibleInstance, ctx, instance);
  } else if (Array.isArray(instance)) {
    return destroyCollection(instance, ctx);
  }
  return destroyInstance(instance, ctx);
}

export function onDestroy<T extends object>(ref: T, handler: ((value: T) => void | Promise<void>) | OnDestroyOptions<T>) {
  const possibleRef = resolvedInstances.get(ref)
  if (possibleRef) {
    return possibleRef.onDestroy(handler);
  }
  return { cancel: () => void 0 };
}

async function destroyInstance(instance: ProviderInstance, ctx: DestroyContext, possibleValue?: any) {
  if (!instance || (instance.status & InstanceStatus.DESTROYED)) {
    return;
  }
  const { scope: { scope, options }, definition, context } = instance;

  if (instance.status & InstanceStatus.HAS_DYNAMIC && possibleValue) {
    const dynamicContext = possibleValue[dynamicContextMetaKey];
    const shared = dynamicContexts.get(dynamicContext);
    if (shared) {
      await destroyCollection(shared.toDestroy, ctx)
    }
  }

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
  const defs = provider.defs;
  provider.defs = [];
  return waitSequence(defs, def => destroyDefinition(def, ctx))
}

export function destroyDefinition(definition: ProviderDefinition, ctx: DestroyContext) {
  const injector = definition.provider.host;
  injector.emitter.emit('provider:destroy', { definition });

  const instances = Array.from(definition.values.values());
  definition.values = new Map();
  instances.forEach(instance => {
    instance.status |= InstanceStatus.DEFINITION_DESTROYED;
  });
  return destroyCollection(instances, ctx);
}

function destroyChildren(instance: ProviderInstance, ctx: DestroyContext) {
  const children = instance.session.children.map(s => s.instance!);
  children.forEach(child => child?.parents?.delete(instance));
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

const disposeDestroyCtx: DestroyContext = { event: 'dispose' };
export function applyDisposableInterfaces(target: object, instance?: ProviderInstance) {
  if (target[disposePatchedMetaKey]) {
    return;
  }
  target[disposePatchedMetaKey] = true; 

  const originalDispose = target[Symbol.dispose] as (() => void) | undefined
  target[Symbol.dispose] = function() {
    originalDispose?.call(this)
    destroy(instance || this, disposeDestroyCtx);
  }

  const originalAsyncDispose = target[Symbol.asyncDispose] as (() => Promise<void>) | undefined
  target[Symbol.asyncDispose] = async function() {
    await originalAsyncDispose?.call(this)
    await destroy(instance || this, disposeDestroyCtx);
  }
}

export async function destroyInjector(injector: Injector, ctx: InjectorDestroyContext = defaultinjectorDestroyCtx, force: boolean = false) {
  if (injector.status & InjectorStatus.DESTROYED || (!force && !injector.options.destroy)) {
    return
  }; 

  const { meta } = injector;
  const scopedLabel = meta[scopedInjectorLabelMetaKey];
  const isScoped = scopedLabel !== undefined
  injector.status |= InjectorStatus.DESTROYED;
  injector.status &= ~InjectorStatus.ACTIVE
  injector.emitter.emit('module:destroy', {});

  // get only self providers
  const providers = Array.from(injector.providers.values())
    .map(r => r.self).filter(Boolean) as ProviderRecord[];

  // destroy self providers and clean all providers 
  const injectorCtx: DestroyContext = { event: 'injector' }
  injector.providers.clear();
  await waitSequence(providers, provider => destroyProvider(provider, injectorCtx));

  const parent = injector.parent as Injector
  if (parent) {
    // remove injector from parent imports
    parent.imports.delete(injector.input);

    // remove (optional) injector from parent scoped injectors
    if (isScoped) {
      parent.meta[scopedInjectorsMetaKey].delete(scopedLabel);
    }
  }

  const manualCtx: InjectorDestroyContext = { event: 'manually' }
  const scopedInjectors = meta[scopedInjectorsMetaKey];
  if (scopedInjectors) {
    const injectors: Injector[] = Array.from(scopedInjectors.values());
    await waitSequence(injectors, inj => destroyInjector(inj, manualCtx, true));
  }

  // then destroy and clean all imported modules
  const injectors = Array.from(injector.imports.values());
  injector.imports.clear();
  await waitSequence(injectors, inj => destroyInjector(inj, manualCtx));
}
