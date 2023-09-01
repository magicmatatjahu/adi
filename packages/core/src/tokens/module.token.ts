import { ADI_MODULE_DEF } from '../private';

import type { ModuleMetadata } from "../types";

export class ModuleToken {
  constructor(
    metadata?: ModuleMetadata,
    public readonly name?: string,
  ) {
    this[ADI_MODULE_DEF] = metadata || {};
  }
};
