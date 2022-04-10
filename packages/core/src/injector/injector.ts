import { toProviderRecord } from './metadata';
import { initModule, importModule } from './module';
import { inject } from './resolver';
import { MODULE_REF } from '../constants';
import { InjectionKind, InjectorStatus } from '../enums';

import type { Session } from './session';
import type { 
  ClassType, 
  ModuleMetadata, ModuleImportItem, ModuleExportItem, InjectorOptions,
  ProviderToken, Provider, ProviderRecord, HookRecord, InjectionHook
} from "../interfaces";

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
    providers.push({ provide: Injector, useValue: this });
    this.provide(...providers);
  }

  init(): Injector | Promise<Injector> {
    if (this.status & InjectorStatus.INITIALIZED) return; 
    return initModule(this);
  }

  get<T>(token: ProviderToken<T>, hooks?: Array<InjectionHook>, session?: Session): T | Promise<T> {
    if (this.status & InjectorStatus.DESTROYED) return; 
    if (this.status & InjectorStatus.INITIALIZED) {
      return inject(this, session, { token, hooks, metadata: { target: Injector, kind: InjectionKind.STANDALONE, annotations: {} } });
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

  export(to: Injector, exps: Array<ModuleExportItem> = []): void {

  }
}
