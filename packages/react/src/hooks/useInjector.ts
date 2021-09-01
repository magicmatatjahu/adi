import { useContext } from "react";
import { Injector } from "@adi/core";

import { InjectorContext } from "../context";

export function useInjector(): Injector {
  const injector = useContext(InjectorContext);

  if (injector === null) {
    throw new Error();
  }

  return injector;
}
