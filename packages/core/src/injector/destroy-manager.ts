import { Injector } from "./injector";
import { DestroyEvent, InstanceRecord } from "../interfaces";
import { ProviderRecord } from "./provider";
import { hasOnDestroyHook } from "../utils";
import { InstanceStatus } from "../enums";

export const DestroyManager = new class {
  async destroy(event: DestroyEvent, instance: InstanceRecord, injector: Injector) {
    if (!instance) {
      return;
    }

    const { scope, value } = instance;
    if (scope.kind.canDestroy(event, instance, scope.options, injector) === false) return;

    hasOnDestroyHook(value) && await value.onDestroy();
    instance.status |= InstanceStatus.DESTROYED;
    instance.def.values.delete(instance.ctx);
    this.removeInstanceRef(instance);
    await this.destroyAll(event, instance.children && Array.from(instance.children), injector);
  }

  async destroyAll(event: DestroyEvent, instances: InstanceRecord[] = [], injector: Injector) {
    for (let i = 0, l = instances.length; i < l; i++) {
      await this.destroy(event, instances[i], injector);
    }
  }

  async destroyRecords(records: ProviderRecord[], injector: Injector) {
    // for destroying the module at least
    for (let i = records.length - 1; i > -1; i--) {
      const record = records[i]
      const definitions = [...record.defs, ...record.constraintDefs];
      for (let definition of definitions) {
        const instances = Array.from(definition.values.values());
        for (let instance of instances) {
          await this.destroy('injector', instance, injector);
        }
      }
    }
  }

  removeInstanceRef(instance: InstanceRecord) {
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
}
