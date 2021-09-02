import { useContext } from "react";
import { Injector } from "@adi/core";

import { InjectorContext } from "../constants";

export function useInjector(): Injector {
  return useContext(InjectorContext);
}
