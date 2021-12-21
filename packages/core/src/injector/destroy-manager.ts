import { DestroyEvent, InstanceRecord, DefinitionRecord } from "../interfaces";
import { ProviderRecord } from "./provider";
import { handleOnDestroy } from "../utils";
import { InstanceStatus } from "../enums";

export const DestroyManager = new class {
  async destroy(event: DestroyEvent, instance: InstanceRecord) {
    if (!instance || instance.status & InstanceStatus.DESTROYED) {
      return;
    }

    const scope = instance.scope;
    const shouldDestroy =
      scope.kind.canDestroy(event, instance, scope.options) ||
      shouldForceDestroy(instance);

    if (!shouldDestroy) return;
    instance.status |= InstanceStatus.DESTROYED;
    
    instance.def.values.delete(instance.ctx);
    removeInstanceRefs(instance);
    await handleOnDestroy(instance);
    await this.destroyAll(instance.children && Array.from(instance.children), event);
    instance.meta.hostInjector && await instance.meta.hostInjector.destroy();
  }

  async destroyAll(instances: InstanceRecord[] = [], event: DestroyEvent = 'default') {
    for (let i = 0, l = instances.length; i < l; i++) {
      await this.destroy(event, instances[i]);
    }
  }

  async destroyRecords(records: ProviderRecord[], event: DestroyEvent = 'default') {
    // for destroying the module as last
    for (let i = records.length - 1; i > -1; i--) {
      await this.destroyRecord(records[i], event);
    }
  }

  destroyRecord(record: ProviderRecord, event: DestroyEvent = 'default') {
    const definitions = [...record.defs, ...record.constraintDefs];
    record.defs = [];
    record.constraintDefs = [];
    return (async () => {
      for (let definition of definitions) {
        await this.destroyDefinition(definition, event);
      }
    })();
  }

  destroyDefinition(definition: DefinitionRecord, event: DestroyEvent = 'default') {
    const instances = Array.from(definition.values.values());
    definition.values = new Map();
    instances.forEach(instance => {
      instance.status |= InstanceStatus.DEF_DESTROYED;
    });
    return this.destroyAll(instances, event);
  }
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
