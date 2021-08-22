import { WrapperRecord } from "../interfaces";
import { ANNOTATIONS } from "../constants";

export function compareOrder(a: WrapperRecord, b: WrapperRecord): number {
  return (a.annotations[ANNOTATIONS.ORDER] as number || 0) - (b.annotations[ANNOTATIONS.ORDER] as number || 0);
}
