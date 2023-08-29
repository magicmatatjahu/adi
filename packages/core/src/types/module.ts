import type { ModuleToken } from '../tokens/module.token';
import type { ProviderToken } from './provider-token';
import type { ForwardReference } from './forward-reference';
import type { InjectorOptions } from './injector';
import type { ProviderType } from './provider';
import type { ClassType } from './types';

export type ModuleImportType<T = any> = 
  | ClassType<T>
  | ModuleToken
  | ExtendedModule<T>
  | Promise<ClassType<T>>
  | Promise<ModuleToken>
  | Promise<ExtendedModule<T>>
  | ForwardReference<ModuleImportType<T>>;

export type ModuleExportType<T = any> = 
  | ProviderToken<T>
  | ProviderType<T>
  | ExportedProvider<T>
  | ExportedModule
  | ClassType
  | ModuleToken
  | ExtendedModule
  | Promise<ClassType<T>>
  | Promise<ModuleToken>
  | Promise<ExtendedModule<T>>
  | ForwardReference<ModuleExportType<T>>;

export interface ModuleOptions extends InjectorOptions {}

export interface ModuleMetadata {
  options?: ModuleOptions;
  annotations?: ModuleAnnotations;
  imports?: Array<ModuleImportType>;
  providers?: Array<ProviderType>;
  exports?: Array<ModuleExportType>;
}

export interface ExtendedModule<T = any> extends ModuleMetadata {
  extends: ModuleImportType<T>;
}

// export interface ImportedModule {
//   from: ClassType | ModuleToken | ForwardReference<ClassType>;
//   import?: Array<ProviderToken<any> | ExportedProvider<any>> | '*';
// }

export interface ExportedProvider<T> {
  export: ProviderToken<T>;
  names: Array<string | symbol | object>;
}

export interface ExportedModule {
  from: ClassType | ModuleToken | ForwardReference<ClassType>;
  export?: Array<ProviderToken<any> | ExportedProvider<any>> | '*';
}

export interface ModuleAnnotations {
  [key: string | symbol]: any;
}
