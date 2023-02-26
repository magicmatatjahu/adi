import { ModuleToken } from '@adi/core';
import { importModules } from './nest-module'; 

import type { ClassType, ExtendedModule } from '@adi/core';
import type { DynamicModule } from "@nestjs/common";

export function nestAdapter(module: ClassType<any> | DynamicModule): ExtendedModule;
export function nestAdapter(modules: Array<ClassType | DynamicModule>): ExtendedModule;
export function nestAdapter(modules: ClassType | DynamicModule | Array<ClassType | DynamicModule>): ExtendedModule {
  // const { providers } = importModules(modules);

  return {
    extends: new ModuleToken(undefined, 'adi:module:nest'),
    // providers,
    // exports: providers,
  }
}
