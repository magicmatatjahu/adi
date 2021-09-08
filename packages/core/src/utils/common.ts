import { ANNOTATIONS } from "../constants";

interface WithAnnotations {
  annotations: Record<string | symbol, any>;
}

export function compareOrder(a: WithAnnotations, b: WithAnnotations): number {
  return (a.annotations[ANNOTATIONS.ORDER] as number || 0) - (b.annotations[ANNOTATIONS.ORDER] as number || 0);
}
