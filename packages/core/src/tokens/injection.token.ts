import { parseInjectionItem } from '../injector';
import { ADI_INJECTABLE_DEF, ADI_INJECTION_ITEM } from '../private';

import type { InjectionTokenOptions } from "../types";

export class InjectionToken<T = any> {
  constructor(
    options: InjectionTokenOptions<T> = {},
    public readonly name?: string,
  ) {
    if (options.inject) {
      this[ADI_INJECTION_ITEM] = parseInjectionItem(options.inject);
    }
    this[ADI_INJECTABLE_DEF] = {
      token: this,
      init: true,
      options,
    };
  }
};
