import { InjectionKind } from "../enums";

import type { InjectionMetadata } from "../interfaces";

export function isMethodInjection(metadata: InjectionMetadata) {
  return (metadata.kind === InjectionKind.PARAMETER) && metadata.descriptor;
}