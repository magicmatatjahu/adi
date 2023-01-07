import { ADI_MODULE_DEF } from '../constants';

import type { ModuleMetadata } from "../interfaces";

export class ModuleToken<T = any> {
  constructor(
    metadata: ModuleMetadata,
  ) {
    this[ADI_MODULE_DEF] = metadata;
  }
};
