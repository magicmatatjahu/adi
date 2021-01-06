import { ComponentDef } from "../interfaces"
import { DEFINITIONS } from "../constants";

export function getComponentDef<M = any>(component: unknown): ComponentDef<M> | undefined {
  return component[DEFINITIONS.COMPONENT] || undefined;
}

export function applyComponentDef<M = any>(target: Object, type: string | symbol, metadata: M = undefined): ComponentDef<M> {
  return Object.defineProperty(target, DEFINITIONS.COMPONENT, { value: defineComponentDef(type, metadata), enumerable: true })
}

function defineComponentDef<M = any>(type: string | symbol, metadata: M): ComponentDef<M> {
  return {
    type,
    metadata,
  };
}
