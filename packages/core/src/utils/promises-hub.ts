type PromisesHubItem = { promise: Promise<any>, resolve: (...args: any[]) => any | Promise<any> };

const hub: WeakMap<object, PromisesHubItem> = new WeakMap();

export const PromisesHub = {
  get(key: any): Promise<any> | undefined {
    return hub.get(key)?.promise;
  },
  create(key: any): Promise<any> {
    const item = PromisesHub.get(key)
    if (item) {
      return item;
    }

    const promise = { promise: undefined, resolve: undefined } as unknown as PromisesHubItem;
    promise.promise = new Promise(resolve => {
      promise.resolve = resolve;
    });
  
    hub.set(key, promise);
    return promise.promise;
  },
  resolve(key: any, result: any): void {
    const promise = hub.get(key);
    if (promise) {
      hub.delete(key);
      promise.resolve(result);
    }
  }
}
