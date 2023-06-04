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

export function getReflectedParameters(target: Object): any[];
export function getReflectedParameters(target: Object, methodName: string | symbol): any[];
export function getReflectedParameters(target: Object, methodName: string | symbol | undefined, index: number): any;
export function getReflectedParameters(target: Object, methodName: string | symbol, index: number): any;
export function getReflectedParameters(target: Object, methodName?: string | symbol, index?: number): any {
  const parameters = Reflection.getOwnMetadata("design:paramtypes", target, methodName) || [];
  if (typeof index === 'number') {
    return parameters[index];
  }
  return parameters;
}

export function getReflectedType(target: Object, key: string | symbol) {
  return Reflection.getOwnMetadata("design:type", target, key);
}

export function getReflectedReturnType(target: Object, method: string | symbol) {
  return Reflection.getOwnMetadata("design:returntype", target, method);
}
