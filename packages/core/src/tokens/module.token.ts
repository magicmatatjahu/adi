import { ADI_MODULE_DEF } from '../private';

import type { ModuleTokenInput, ModuleTokenOptions } from "../types";

export class ModuleToken {
  static create(input: ModuleTokenInput = {}, options?: ModuleTokenOptions): ModuleToken {
    const token = new this(options);
    token[ADI_MODULE_DEF] = input;
    return token;
  }

  protected constructor(
    protected readonly options?: ModuleTokenOptions,
  ) {}

  get name() {
    return this.options?.name;
  }
};
