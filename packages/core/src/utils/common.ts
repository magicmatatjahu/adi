import { ANNOTATIONS } from "../constants";
import { Annotations } from "../interfaces";

interface WithAnnotations {
  annotations: Annotations;
}

export function compareOrder(a: WithAnnotations, b: WithAnnotations): number {
  return (a.annotations[ANNOTATIONS.ORDER] as number || 0) - (b.annotations[ANNOTATIONS.ORDER] as number || 0);
}
