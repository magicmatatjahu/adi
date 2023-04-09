import { inject } from 'vue-demi'

import { INJECTOR_KEY } from './keys';
import { NotFoundInjectorError } from "./problems";
import { assertEnv } from './utils';

import type { Injector } from "@adi/core";

export function useInjector(): Injector {
  assertEnv()
  const injector = inject<Injector>(INJECTOR_KEY, null);
  if (injector === null) {
    throw new NotFoundInjectorError();
  }
  return injector;
}
