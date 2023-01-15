interface ReflectAPI {
  getOwnMetadata(metadataKey: any, target: Object): any;
  getOwnMetadata(metadataKey: any, target: Object, targetKey: string | symbol): any;
}

export const Reflection: ReflectAPI = ((Reflect as unknown as ReflectAPI).getOwnMetadata ? Reflect : {
  getOwnMetadata() {
    return undefined;
  }
}) as ReflectAPI;

