import { Type } from "@adi/core";
import { ExceptionHandler } from "./exception-handler.interface";

export function UseExceptionHandler(...handlers: Array<Type | ExceptionHandler>) {
  return function(target: Object, key: string | symbol, indexOrDescriptor?: number | PropertyDescriptor) {
    if (indexOrDescriptor === undefined) {
      throw new Error("ExceptionHandler cannot be used as Parameter decorator");
    }
  }
}
