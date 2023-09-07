import { createContext, createElement } from "react";

import type { Injector } from "@adi/core";
import type { ReactNode } from "react";

export type InjectorContextValue = {
  injector: Injector,
}

export const InjectorContext = createContext<InjectorContextValue | null>(null);

export function createProvider(injector: Injector, children?: ReactNode) {
  return createElement(InjectorContext.Provider, { value: { injector } }, children);
}
