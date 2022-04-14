import { useContext } from "react";

import { InjectorContext } from "../context";

import type { Injector } from "@adi/core";

const errorMessage = `Injector context not found. Check if you have connected the ADI Module in the current component's VDOM parent tree.`;

export function useInjector(strict: boolean = false): Injector {
  const injector = useContext(InjectorContext);
  if (injector === null && strict === true) {
    throw new Error(errorMessage);
  }
  return injector;
}
