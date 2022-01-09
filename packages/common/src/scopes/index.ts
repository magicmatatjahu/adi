import { InstanceScope as InstanceScopeDef } from "./instance.scope";
import { LocalScope as LocalScopeDef } from "./local.scope";
import { ResolutionScope as ResolutionScopeDef } from "./resolution.scope";

export const InstanceScope = new InstanceScopeDef();
export const LocalScope = new LocalScopeDef();
export const ResolutionScope = new ResolutionScopeDef();

export const CommonScopes = {
  INSTANCE: InstanceScope,
  LOCAL: LocalScope,
  RESOLUTION: ResolutionScope,
}
