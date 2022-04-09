export const Reflection = ((Reflect as any).getOwnMetadata ? Reflect : {
  getOwnMetadata(metaKey: string) {
    switch(metaKey) {
      case "design:type": return undefined;
      case "design:paramtypes": return [];
      case "design:returntype": return undefined;
      default: return undefined;
    }
  }
}) as any;