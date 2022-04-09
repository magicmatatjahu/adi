import { toProviderRecord } from './metadata';
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
  public status: InjectorStatus = InjectorStatus.NONE;
  public readonly providers = new Map<ProviderToken, Array<ProviderRecord>>();
  public readonly hooks: Array<HookRecord> = [];

  constructor(
    public readonly metatype: ClassType | ModuleMetadata | Array<Provider> = [],
    public readonly parent?: Injector, // = NilInjector,
    public readonly options: InjectorOptions = {},
  ) {
    const providers: Provider[] = [];
    if (typeof metatype === 'function') { // module class
      providers.push({ provide: MODULE_REF, useExisting: metatype }, metatype);
    } else if (Array.isArray(metatype)) { // array of providers
      providers.push({ provide: MODULE_REF, useValue: metatype }, ...metatype);
      this.status |= InjectorStatus.BUILDED;
    } else { // object module
      providers.push({ provide: MODULE_REF, useValue: metatype });
    }

    providers.push({ provide: Injector, useValue: this });
    this.provide(...providers);
  }

  init() {
    if (this.status & InjectorStatus.INITIALIZED) return; 
    this.status |= InjectorStatus.INITIALIZED;
  }

  get<T>(token: ProviderToken<T>, hooks?: Array<InjectionHook>, session?: Session): T | undefined | Promise<T | undefined> {
    return inject(this, session, { token, hooks, metadata: { kind: InjectionKind.STANDALONE, annotations: {} } });
    // if (this.status & InjectorStatus.DESTROYED) return; 
    // if (this.status & InjectorStatus.INITIALIZED) {
    //   return inject(this, session, { token, hooks, metadata: { kind: InjectionKind.STANDALONE, annotations: {} } });
    // };
  }

  import(
    injector: ClassType | ModuleMetadata | Array<Provider>,
    options?: InjectorOptions,
  ): Injector {
    return new Injector(injector, this, options);
  }

  provide(...providers: Provider[]): void {
    if (this.status & InjectorStatus.DESTROYED) return;
    providers.forEach(provider => provider && toProviderRecord(this, provider));
  }

  export(to: Injector, exps: Array<ModuleExportItem> = []): void {

  }
}
