import { Token } from "@adi/core/lib/types";
import { Named, Wrapper } from "@adi/core";

import { COMPONENT_TOKEN } from "../constants";
import { useInject } from "./useInject";

export function useComponent<T = any>(component: Token<T>, wrapper?: Wrapper): React.JSXElementConstructor<T> {
  return useInject(COMPONENT_TOKEN, Named(component, wrapper)) as any;
}
