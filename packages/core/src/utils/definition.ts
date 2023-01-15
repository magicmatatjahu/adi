const storage = new Map<string | symbol, WeakMap<object, Record<string | symbol, any>>>();

function get<T extends object>(subStorage: WeakMap<object, Record<string | symbol, any>>, target: object, factory?: () => T): T | undefined {
  let metadata = subStorage.get(target) as T | undefined;
  if (metadata || !factory) {
    return metadata;
  }
  subStorage.set(target, metadata = factory());
  return metadata;
}

export function createDefinition<T extends object>(metadataKey: string | symbol, factory: () => T) {
  let subStorage = storage.get(metadataKey);
  if (!subStorage) {
    storage.set(metadataKey, subStorage = new WeakMap());
  }
  
  return {
    ensure(target: object): T {
      if (target && target.hasOwnProperty(metadataKey)) {
        return target[metadataKey];
      }
      return get(subStorage, target, factory);
    },
    get(target: object): T | undefined {
      if (target && target.hasOwnProperty(metadataKey)) {
        return target[metadataKey];
      }
      return get(subStorage, target);
    }
  }
}