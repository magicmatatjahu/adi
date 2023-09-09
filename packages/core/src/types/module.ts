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
  | ImportedModule<T>
  | Promise<ClassType<T>>
  | Promise<ModuleToken>
  | Promise<ExtendedModule<T>>
  | Promise<ImportedModule<T>>
  | ForwardReference<ModuleImportType<T>>;

export type ModuleExportType<T = any> = 
  | ClassType<T>
  | ModuleToken
  | ExtendedModule<T>
  | ExportedModule<T>
  | ProviderToken<T>
  | ProviderType<T>
  | ExportedProvider<T>
  | Promise<ClassType<T>>
  | Promise<ModuleToken>
  | Promise<ExtendedModule<T>>
  | Promise<ExportedModule<T>>
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

export interface ImportedProvider<T = any> {
  export: ProviderToken<T>;
  names: Array<string | symbol | object>;
}

export interface ImportedModule<T = any> {
  from: ClassType<T> | ModuleToken | ForwardReference<ClassType<T>>;
  import?: Array<ProviderToken<any> | ExportedProvider<any>> | '*';
}

export interface ExportedProvider<T = any> {
  export: ProviderToken<T>;
  names: Array<string | symbol | object>;
}

export interface ExportedModule<T = any> {
  from: ClassType<T> | ModuleToken | ForwardReference<ClassType<T>>;
  export: Array<ProviderToken<any> | ExportedProvider<any>> | '*';
}

export interface ModuleAnnotations {
  [key: string | symbol]: any;
}
