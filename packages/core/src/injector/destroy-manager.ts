import { Injector } from "./injector";
import { DestroyEvent, InstanceRecord } from "../interfaces";
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

    await handleOnDestroy(instance);
    instance.status |= InstanceStatus.DESTROYED;
    instance.def.values.delete(instance.ctx);
    removeInstanceRefs(instance);
    await this.destroyAll(event, instance.children && Array.from(instance.children));
  }

  async destroyAll(event: DestroyEvent, instances: InstanceRecord[] = []) {
    for (let i = 0, l = instances.length; i < l; i++) {
      await this.destroy(event, instances[i]);
    }
  }

  async destroyRecords(records: ProviderRecord[]) {
    // for destroying the module as last
    for (let i = records.length - 1; i > -1; i--) {
      const record = records[i]
      const definitions = [...record.defs, ...record.constraintDefs];
      for (let definition of definitions) {
        const instances = Array.from(definition.values.values());
        for (let instance of instances) {
          instance.status |= InstanceStatus.HOST_DESTROYED;
          await this.destroy('injector', instance);
        }
      }
    }
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
    // Host (Injector) destroyed case
    ((status & InstanceStatus.HOST_DESTROYED) && (parents === undefined || parents.size === 0)) ||
    // Circular injection case
    ((status & InstanceStatus.CIRCULAR) && (parents && parents.size === 1))
  );
}
