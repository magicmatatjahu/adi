import { ADI } from '../adi';
import { destroyInjector } from './garbage-collector';
import { toProviderRecord, serializeInjectArguments, createInjectionArgument } from './metadata';
import { initModule } from './new-module';
import { inject } from './resolver';
import { INITIALIZERS, MODULE_REF } from '../constants';
import { InjectionKind, InjectorStatus } from '../enums';
import { All } from '../hooks';
import { SingletonScope } from '../scopes';

import type { Session } from './session';
import type { ModuleToken } from './module-token';
import type { 
  ClassType, 
  ModuleMetadata, ModuleImportItem, ModuleExportItem, InjectorOptions,
  ProviderToken, Provider, ProviderRecord, HookRecord, InjectionHook, InjectionAnnotations, ModuleID
} from "../interfaces";

export class Injector {
  static create(
    metatype: ClassType | ModuleToken = [],
    options?: InjectorOptions,
    parent?: Injector,
  ): Injector {
    return new Injector(metatype, options, parent);
  }

  public adi: ADI = ADI.globalADI;
  public status: InjectorStatus = InjectorStatus.NONE;
  public readonly imports = new Map<ClassType | ModuleToken, Injector>();
  public readonly providers = new Map<ProviderToken, Array<ProviderRecord>>();
  public readonly hooks: Array<HookRecord> = [];
  public readonly meta: Record<string | symbol, any> = {};

  constructor(
    public readonly metatype: ClassType | ModuleToken,
    public readonly options: InjectorOptions = {},
    public readonly parent: Injector | null = null,
  ) {
    options.id = options.id || 'static';
    options.importing = options.importing || 'enabled';
    options.exporting = options.exporting || 'enabled';
    options.scopes = ['any', metatype as ClassType, ...(options.scopes || [])];

    // if (parent !== null) {
    //   importModuleToParent(this, metatype as ClassType, options.id, parent);
    // } 

    // providers.push({ provide: MODULE_REF, useExisting: metatype }, metatype);

    // const providers: Provider[] = [];
    // if (typeof metatype === 'function') { // module class
    //   providers.push({ provide: MODULE_REF, useExisting: metatype }, metatype);
    // } else if (Array.isArray(metatype)) { // array of providers
    //   providers.push({ provide: MODULE_REF, useValue: metatype }, ...metatype);
    // } else { // object module
    //   providers.push({ provide: MODULE_REF, useValue: metatype });
    // }

    if (parent) {
      parent.imports.set(metatype, this);
    }

    const providers: Provider[] = [
      { provide: Injector, useValue: this, scope: SingletonScope },
      { provide: INITIALIZERS, hooks: [All()] }
    ];
    if (typeof metatype === 'function') {
      providers.push({ provide: MODULE_REF, useExisting: metatype }, metatype as ClassType);
    } else {
      providers.push({ provide: MODULE_REF, useValue: metatype });
    }
    this.provide(...providers);
  }

  init(): Injector | Promise<Injector> {
    if (this.status & InjectorStatus.INITIALIZED) return; 
    return initModule(this);
  }

  destroy(): Promise<void> {
    if (this.status & InjectorStatus.DESTROYED) return; 
    return destroyInjector(this as any);
  }

  get<T = any>(token?: ProviderToken<T>): T | Promise<T>;
  get<T = any>(hooks?: Array<InjectionHook>): T | Promise<T>;
  get<T = any>(annotations?: InjectionAnnotations): T | Promise<T>;
  get<T = any>(token?: ProviderToken<T>, hooks?: Array<InjectionHook> | InjectionAnnotations): T | Promise<T>;
  get<T = any>(hooks?: Array<InjectionHook>, annotations?: InjectionAnnotations): T | Promise<T>;
  get<T = any>(token?: ProviderToken<T>, hooks?: Array<InjectionHook>, annotations?: InjectionAnnotations): T | Promise<T>;
  get<T = any>(token?: ProviderToken<T> | Array<InjectionHook> | InjectionAnnotations, hooks?: Array<InjectionHook> | InjectionAnnotations, annotations?: InjectionAnnotations, session?: Session): T | Promise<T>;
  get<T = any>(token?: ProviderToken<T> | Array<InjectionHook> | InjectionAnnotations, hooks?: Array<InjectionHook> | InjectionAnnotations, annotations?: InjectionAnnotations, session?: Session): T | Promise<T> {
    if (this.status & InjectorStatus.DESTROYED || (this.status & InjectorStatus.INITIALIZED) === 0) return; 
    ({ token, hooks, annotations } = serializeInjectArguments(token as ProviderToken<T>, hooks as Array<InjectionHook>, annotations));
    return inject(this as any, session, createInjectionArgument(token as ProviderToken<T>, hooks as Array<InjectionHook>, { target: Injector, kind: InjectionKind.STANDALONE, annotations }));
  }

  import(
    module: ModuleImportItem | ModuleMetadata | Array<Provider>,
    options?: InjectorOptions,
  ): Injector | Promise<Injector> {
    if (this.status & InjectorStatus.DESTROYED || this.options.importing !== 'enabled') return; 
    // return importModule(this, module, options);
  }

  provide(...providers: Provider[]): void {
    if (this.status & InjectorStatus.DESTROYED) return;
    providers.forEach(provider => provider && toProviderRecord(this as any, provider));
  }

  // export(exports: Array<ModuleExportItem> = [], to: Injector): void {
  //   if (this.status & InjectorStatus.DESTROYED || this.options.exporting !== 'enabled') return; 
  //   return exports.forEach(exp => processExport(exp, this, this.parent));
  // }
}
