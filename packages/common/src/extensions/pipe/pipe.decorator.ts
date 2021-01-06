import { Type } from "@adi/core";
import { PipeTransform } from "./pipe.interface";

export function UsePipe(...pipes: Array<Type | PipeTransform>) {
  return function(target: Object, key: string | symbol, indexOrDescriptor?: number | PropertyDescriptor) {

  }
}
