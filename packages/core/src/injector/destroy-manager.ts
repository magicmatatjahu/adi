import { Injector } from "./injector";
import { Destroyable, DestroyEvent, InstanceRecord } from "../interfaces";
import { ProviderRecord } from "./provider";
import { hasOnDestroyHook } from "../utils";

export const DestroyManager = new class {
  async destroy(event: DestroyEvent, instance: InstanceRecord, injector: Injector) {
    if (!instance) {
      return;
    }

    const scope = instance.scope;
    const canDestroy = scope.kind.onDestroy(event, instance, scope.options, injector);

    if (canDestroy === true) {
      const value = instance.value;
      if (hasOnDestroyHook(value)) {
        await value.onDestroy();
        instance.def.values.delete(instance.ctx);
        this.removeInstanceRefFromChildren(instance);
        await this.destroyAll(event, instance.children && Array.from(instance.children), injector);
      }
    };
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

  removeInstanceRefFromChildren(instance: InstanceRecord) {
    const children = instance.children;
    if (children === undefined) return;
    
    children.forEach(child => {
      child.parents?.delete(instance);
    });
  }

  createDestroyable<T>(instance: InstanceRecord<T>): Destroyable<T> | never {
    if (instance === undefined) {
      throw new Error('instance must to be defined to create the Destroyable instance!');
    }
    return {
      value: instance.value,
      destroy: () => this.destroy('manually', instance, instance.def.record.host),
    }
  }
}
