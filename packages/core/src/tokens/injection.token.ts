import { ADI_INJECTABLE_DEF } from '../private';

import type { InjectionTokenOptions } from "../interfaces";

export class InjectionToken<T = any> {
  constructor(
    options: InjectionTokenOptions<T> = {},
    public readonly name?: string,
  ) {
    this[ADI_INJECTABLE_DEF] = {
      token: this,
      init: true,
      options,
    };
  }
};
