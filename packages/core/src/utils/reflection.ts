interface ReflectAPI {
  getMetadata(metadataKey: any, target: Object): any;
  getMetadata(metadataKey: any, target: Object, targetKey: string | symbol): any;
  getOwnMetadata(metadataKey: any, target: Object): any;
  getOwnMetadata(metadataKey: any, target: Object, targetKey: string | symbol): any;
}

export const Reflection: ReflectAPI = ((Reflect as unknown as ReflectAPI).getOwnMetadata ? Reflect : {
  getMetadata() {
    return undefined;
  },
  getOwnMetadata() {
    return undefined;
  }
}) as ReflectAPI;

export function getReflectParameters(target: Object): any[];
export function getReflectParameters(target: Object, key: string | symbol): any[] | any;
export function getReflectParameters(target: Object, key: string | symbol | undefined, index: number): any;
export function getReflectParameters(target: Object, key: string | symbol, index: number): any;
export function getReflectParameters(target: Object, key?: string | symbol, index?: number): any {
  const parameters = Reflection.getOwnMetadata("design:paramtypes", target, key);
  if (typeof index === 'number') {
    return parameters[index];
  }
  return parameters;
}