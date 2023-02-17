import { typeOf, ReflectionKind } from '@deepkit/type';
import { InjectionToken } from "@adi/core";

import type { AbstractClassType, ClassType } from "@adi/core";
import type { ReceiveType, Type } from '@deepkit/type';

export function provide<T>(args: any[] = [], p?: ReceiveType<T>): InjectionToken<T> {
  // const receivedType = typeOf(args, p);
  // console.log(receivedType);
  // return getType(receivedType);
  return;
}

export function hookReflection<T>(args: any[] = [], p?: ReceiveType<T>) {

}

const cache = new WeakMap<Type, InjectionToken>();
export function getType<T>(type: Type): ClassType | AbstractClassType | InjectionToken<T> {
  switch (type.kind) {
    case ReflectionKind.class: {
      return type.classType;
    }
    case ReflectionKind.objectLiteral: {
      const cached = cache.get(type);
      if (cached) {
        return cached;
      }
      const token = new InjectionToken();
      cache.set(type, token);
      return token;
    }
  }
}
