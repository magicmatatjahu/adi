type PromisesHubItem = { promise: Promise<any>, resolve: (...args: any[]) => any | Promise<any> };

const hub: WeakMap<object, PromisesHubItem> = new WeakMap();

export function getOrCreatePromise(value: object) {
  let item = hub.get(value);
  if (item) {
    return item;
  }
  
  item = { promise: undefined, resolve: undefined } as unknown as PromisesHubItem;
  item.promise = new Promise(resolve => {
    item!.resolve = resolve;
  });

  hub.set(value, item);
  return item.promise;
}

export function resolvePromise(value: object, result: any) {
  const promise = hub.get(value);
  if (promise) {
    return promise.resolve(result);
  }
}
