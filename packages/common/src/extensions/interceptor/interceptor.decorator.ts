import { Type } from "@adi/core";
import { Interceptor } from "./interceptor.interface";

export function UseInterceptor(...interceptors: Array<Type | Interceptor | Function>) {
  return function(target: Object, key: string | symbol, indexOrDescriptor?: PropertyDescriptor) {
    if (indexOrDescriptor === undefined) {
      throw new Error("Interceptor cannot be used as Parameter decorator");
    }
  }
}
