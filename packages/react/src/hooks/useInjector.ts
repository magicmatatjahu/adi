import { useContext } from "react";

import { InjectorContext } from "../context";
import { NotFoundInjectorError } from "../errors";

import type { Injector } from "@adi/core";

export function useInjector(): Injector {
  const ctx = useContext(InjectorContext);

  if (ctx === null) {
    throw new NotFoundInjectorError();
  }
  
  return ctx.injector;
}
