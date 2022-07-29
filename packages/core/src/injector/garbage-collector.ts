import { InstanceStatus, InjectorStatus } from "../enums";
import { waitSequence } from "../utils";
import { handleOnDestroyLifecycle } from '../utils/lifecycle-hooks';

import type { Injector } from "./injector";
import type { ProviderRecord, ProviderDefinition, ProviderInstance } from "../interfaces";

export type DestroyEvent = 'default' | 'injector' | 'manually';

export interface DestroyContext {
  event: DestroyEvent;
}

export async function destroy(instance: ProviderInstance, event?: DestroyEvent): Promise<void>;
export async function destroy(instances: Array<ProviderInstance>, event?: DestroyEvent): Promise<void>;
export async function destroy(instances: ProviderInstance | Array<ProviderInstance>, event?: DestroyEvent): Promise<void>;
export async function destroy(instances: ProviderInstance | Array<ProviderInstance>, event: DestroyEvent = 'default'): Promise<void> {
  if (Array.isArray(instances)) {
    return destroyCollection(instances, event);
  }
  return destroyInstance(instances, event);
}

async function destroyInstance(instance: ProviderInstance, event: DestroyEvent = 'default') {
  if (!instance || instance.status & InstanceStatus.DESTROYED) {
    return;
  }

  const { kind, options } = instance.scope;
  const shouldDestroy = kind.canDestroy(instance, options, { event }) || shouldForceDestroy(instance);

  if (!shouldDestroy) return;
  instance.status |= InstanceStatus.DESTROYED;
  instance.def.values.delete(instance.ctx);
  removeRefs(instance);
  
  await handleOnDestroyLifecycle(instance);
  instance.children && await destroyCollection(Array.from(instance.children), event);
}

async function destroyCollection(instances: Array<ProviderInstance> = [], event?: DestroyEvent) {
  return waitSequence(instances, instance => destroy(instance, event));
}

export function destroyRecord(record: ProviderRecord, event?: DestroyEvent) {
  const defs = record.defs;
  record.defs = [];
  return waitSequence(defs, def => destroyDefinition(def, event))
}

export function destroyDefinition(definition: ProviderDefinition, event?: DestroyEvent) {
  const instances = Array.from(definition.values.values());
  definition.values = new Map();
  instances.forEach(instance => {
    instance.status |= InstanceStatus.DEFINITION_DESTROYED;
  });
  return destroyCollection(instances, event);
}

export async function destroyInjector(injector: Injector) {
  if (injector.status & InjectorStatus.DESTROYED) return; 
  injector.status |= InjectorStatus.DESTROYED;

  // get only self providers
  const records = Array.from(injector.providers.values())
    .map(r => r[0]).filter(Boolean);

  injector.providers.clear()
  try {
    await waitSequence(records, record => destroyRecord(record, 'injector'));
  } catch {}

  // remove injector from parent imports
  if (injector.parent !== null) {
    const importInParent = injector.parent.imports.get(injector.metatype as any);
    importInParent && importInParent.delete(injector.options.id);
  }

  // then destroy and clean all imported modules
  const imports = Array.from(injector.imports.values());
  injector.imports.clear();
  try {
    return waitSequence(
      imports, 
      imp => waitSequence(Array.from(imp.values()), inj => destroyInjector(inj)),
    );
  } catch {}
}

function removeRefs(instance: ProviderInstance) {
  // from parents
  const parents = instance.parents;
  parents && parents.forEach(parent => {
    parent.children?.delete(instance);
  });

  // from children
  const children = instance.children;
  children && children.forEach(child => {
    child.parents?.delete(instance);
  });
}

function shouldForceDestroy(instance: ProviderInstance) {
  const { status, parents } = instance;
  return (
    // Definition destroyed case
    ((status & InstanceStatus.DEFINITION_DESTROYED) && (parents === undefined || parents.size === 0)) ||
    // Circular injection case
    ((status & InstanceStatus.CIRCULAR) && (parents && parents.size === 1))
  );
}
