import { ADI_INJECTABLE_DEF } from '../constants';

import type { InjectionTokenOptions } from "../interfaces";

export class InjectionToken<T = any> {
  constructor(
    options: InjectionTokenOptions<unknown> = {},
    public readonly name?: string,
  ) {
    if (options !== undefined) {
      this[ADI_INJECTABLE_DEF] = {
        token: this,
        options: options,
      };
    }
  }
};
