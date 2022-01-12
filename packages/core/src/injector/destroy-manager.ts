import { DestroyEvent, InstanceRecord, DefinitionRecord } from "../interfaces";
import { ProviderRecord } from "./provider";
import { handleOnDestroy } from "../utils";
import { InstanceStatus } from "../enums";

export async function destroy(instance: InstanceRecord, event: DestroyEvent = 'default') {
  if (!instance || instance.status & InstanceStatus.DESTROYED) {
    return;
  }

  const scope = instance.scope;
  const shouldDestroy =
    scope.kind.canDestroy(event, instance, scope.options) ||
    shouldForceDestroy(instance);

  if (!shouldDestroy) return;
  instance.def.values.delete(instance.ctx);
  instance.status |= InstanceStatus.DESTROYED;
  removeInstanceRefs(instance);
  
  instance.value = await instance.value;
  await handleOnDestroy(instance);
  instance.children && await destroyAll(Array.from(instance.children), event);
  instance.meta.hostInjector && await instance.meta.hostInjector.destroy();
}

export async function destroyAll(instances: InstanceRecord[] = [], event: DestroyEvent = 'default') {
  for (let i = 0, l = instances.length; i < l; i++) {
    await destroy(instances[i], event);
  }
}

export async function destroyRecords(records: ProviderRecord[], event: DestroyEvent = 'default') {
  for (let i = 0, l = records.length; i < l; i++) {
    await destroyRecord(records[i], event);
  }
}

export function destroyRecord(record: ProviderRecord, event: DestroyEvent = 'default') {
  const definitions = [...record.defs, ...record.constraintDefs];
  record.defs = [];
  record.constraintDefs = [];
  return (async () => {
    for (let definition of definitions) {
      await destroyDefinition(definition, event);
    }
  })();
}

export function destroyDefinition(definition: DefinitionRecord, event: DestroyEvent = 'default') {
  const instances = Array.from(definition.values.values());
  definition.values = new Map();
  instances.forEach(instance => {
    instance.status |= InstanceStatus.DEF_DESTROYED;
  });
  return destroyAll(instances, event);
}

function removeInstanceRefs(instance: InstanceRecord) {
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

function shouldForceDestroy(instance: InstanceRecord) {
  const { status, parents } = instance;
  return (
    // Definition destroyed case
    ((status & InstanceStatus.DEF_DESTROYED) && (parents === undefined || parents.size === 0)) ||
    // Circular injection case
    ((status & InstanceStatus.CIRCULAR) && (parents && parents.size === 1))
  );
}
