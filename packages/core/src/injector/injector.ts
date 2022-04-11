import { destroyInjector } from './garbage-collector';
import { toProviderRecord } from './metadata';
import { initModule, importModule, exportModule } from './module';
import { inject } from './resolver';
import { INITIALIZERS, MODULE_REF } from '../constants';
import { InjectionKind, InjectorStatus } from '../enums';
import { All } from '../hooks';
import { SingletonScope } from '../scopes';

import type { Session } from './session';
import type { 
  ClassType, 
  ModuleMetadata, ModuleImportItem, ModuleExportItem, InjectorOptions,
  ProviderToken, Provider, ProviderRecord, HookRecord, InjectionHook
} from "../interfaces";
import { createInjectionArgument } from '.';

export class Injector {
  static create(
    metatype: ClassType | ModuleMetadata | Array<Provider> = [],
    injector?: Injector,
    options?: InjectorOptions,
  ): Injector {
    return new Injector(metatype, injector, options);
  }

  public status: InjectorStatus = InjectorStatus.NONE;
  public readonly imports = new Map<ClassType, Map<string | symbol, Injector>>();
  public readonly providers = new Map<ProviderToken, Array<ProviderRecord>>();
  public readonly hooks: Array<HookRecord> = [];
  public readonly meta: Record<string | symbol, any> = {};

  constructor(
    public readonly metatype: ClassType | ModuleMetadata | Array<Provider> = [],
    public readonly parent: Injector | null = null,
    public readonly options: InjectorOptions = {},
  ) {
    const providers: Provider[] = [];
    if (typeof metatype === 'function') { // module class
      providers.push({ provide: MODULE_REF, useExisting: metatype }, metatype);
    } else if (Array.isArray(metatype)) { // array of providers
      providers.push({ provide: MODULE_REF, useValue: metatype }, ...metatype);
    } else { // object module
      providers.push({ provide: MODULE_REF, useValue: metatype });
    }

    options.scopes = ['any', metatype as ClassType, ...(options.scopes || [])];
    providers.push(
      { provide: Injector, useValue: this, scope: SingletonScope },
      { provide: INITIALIZERS, hooks: [All()] }
    );
    this.provide(...providers);
  }

  init(): Injector | Promise<Injector> {
    if (this.status & InjectorStatus.INITIALIZED) return; 
    return initModule(this);
  }

  destroy(): Promise<void> {
    if (this.status & InjectorStatus.DESTROYED) return; 
    return destroyInjector(this);
  }

  get<T>(token: ProviderToken<T>, hooks?: Array<InjectionHook>, session?: Session): T | Promise<T> {
    if (this.status & InjectorStatus.DESTROYED) return; 
    if (this.status & InjectorStatus.INITIALIZED) {
      return inject(this, session, createInjectionArgument(token, hooks, { target: Injector, kind: InjectionKind.STANDALONE, annotations: {} })); // TODO: Change order of arguments, injection argument, injector, session
    };
  }

  import(
    module: ModuleImportItem | ModuleMetadata | Array<Provider>,
    options?: InjectorOptions,
  ): Injector | Promise<Injector> {
    return importModule(this, module, options);
  }

  provide(...providers: Provider[]): void {
    if (this.status & InjectorStatus.DESTROYED) return;
    providers.forEach(provider => provider && toProviderRecord(this, provider));
  }

  export(exports: Array<ModuleExportItem> = [], to: Injector): void {
    return exportModule(exports, this, to)
  }
}
