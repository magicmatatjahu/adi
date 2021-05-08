import { getProviderDef, getModuleDef } from "../decorators";
import { 
  InjectionOptions, InjectionSession,
  ProviderRecord, WrapperRecord, DefinitionRecord, InstanceRecord, 
  Provider, ProviderDef, WrapperDef, NextWrapper, Type,
  InjectorOptions, InjectorScopeType, ModuleMetadata, DynamicModule,
  ForwardRef,
} from "../interfaces";
import { MODULE_INITIALIZERS } from "../constants";
import { InjectionStatus, ScopeFlags } from "../enums";
import { Token } from "../types";
import { resolveRef } from "../utils";

import { InjectorMetadata } from "./metadata";

export class Injector {
  // own records
  private readonly records = new Map<Token, ProviderRecord>();
  // records from imported modules
  private readonly importedRecords = new Map<Token, ProviderRecord>();
  // scopes of injector
  private scopes: Array<InjectorScopeType> = ['any'];

  constructor(
    private readonly injector: Type<any> | ModuleMetadata | Array<Provider> = [],
    private readonly parent: Injector = NilInjector,
    private readonly options: InjectorOptions = {},
  ) {
    if (options !== undefined) {
      const { setupProviders, scope } = options;
      setupProviders !== undefined && this.addProviders(options.setupProviders);
      if (scope !== undefined) {
        Array.isArray(scope) ? this.scopes.push(...scope) : this.scopes.push(scope);
      }
    }

    if (typeof injector === "function") {
      this.scopes.push(injector);
    } else {
      this.addProviders(Array.isArray(injector) ? injector : injector.providers);
    }

    // add Injector as self provider
    this.addProvider({ provide: Injector, useValue: this });
  }

  get<T>(token: Token<T>, options?: InjectionOptions, session?: InjectionSession): Promise<T | undefined> | T | undefined {
    options = options || {} as any;
    const newSession = InjectorMetadata.createSession(undefined, options, session);

    const wrapper = options && options.useWrapper;
    const nextFn = (nextWrapper: WrapperDef) => (injector: Injector, s: InjectionSession) => {
      const $$nextWrapper = nextWrapper['$$nextWrapper'];
      if ($$nextWrapper !== undefined) {
        const next: NextWrapper = nextFn($$nextWrapper);
        return nextWrapper(injector, s, next);
      }
      // fix passing options
      const next: NextWrapper = (i: Injector, s: InjectionSession) => i.retrieveRecord(s.options.token || token, s.options, s);
      return nextWrapper(injector, s, next);
    }
    if (wrapper) {
      return nextFn(wrapper)(this, newSession);
    }

    return this.retrieveRecord(token, options, newSession);
  }

  getParentInjector(): Injector {
    return this.parent;
  }

  async compile(): Promise<void> {
    if (typeof this.injector === "function") {
      await this.processModule(this.injector, []);
    }
  }

  private retrieveRecord<T>(token: Token<T>, options?: InjectionOptions, session?: InjectionSession): Promise<T | undefined> | T | undefined {
    const record = this.getRecord(token);
    if (record !== undefined) {
      const def = this.getDefinition(record, session);
      return this.resolveDef(def, options, session);
    }
    return this.getParentInjector().get(token, options, session);
  }

  private resolveDef<T>(def: DefinitionRecord<T>, options?: InjectionOptions, session?: InjectionSession): Promise<T | undefined> | T | undefined {
    let scope = def.scope;
    if (scope.flags & ScopeFlags.CAN_OVERRIDE) {
      scope = options.scope || scope;
    }
    const instance = InjectorMetadata.getInstanceRecord(def, scope, session);
    return this.resolveInstance(def.record, def, instance, session);
  }

  private resolveInstance<T>(
    record: ProviderRecord<T>,
    def: DefinitionRecord<T>,
    instance: InstanceRecord<T>,
    session?: InjectionSession,
  ): Promise<T> | T {
    if (instance.status & InjectionStatus.RESOLVED) {
      return instance.value;
    }

    // InjectionStatus.UNKNOWN === 1
    if (instance.status === 1) {
      instance.status |= InjectionStatus.PENDING;

      const providerWrappers = this.getWrappers(record, session);
      const length = providerWrappers.length;
  
      const nextWrapper = (i = 0) => (injector: Injector, s: InjectionSession) => {
        if (i === length) {
          return def.factory(injector, s);
        }
        const next: NextWrapper = nextWrapper(i + 1);
        return providerWrappers[i].wrapper(injector, s, next);
      }
      const value = nextWrapper()(record.hostInjector, session) as T;

      if (instance.status & InjectionStatus.CIRCULAR) {
        Object.assign(instance.value, value);
      } else {
        instance.value = value;
      }

      instance.status = InjectionStatus.RESOLVED;
      return instance.value;
    }

    // Circular case
    if (instance.status & InjectionStatus.CIRCULAR) {
      return instance.value;
    }
    const proto = def.proto;
    if (!proto) {
      throw new Error("Circular Dependency");
    }
    (instance as InstanceRecord).status |= InjectionStatus.CIRCULAR;
    return (instance.value = Object.create(proto));
  }

  private getRecord<T>(
    token: Token<T>,
  ): ProviderRecord {
    let record = this.records.get(token) || this.importedRecords.get(token);

    // check for treeshakable provider - `providedIn` case
    if (record === undefined) {
      const def = getProviderDef(token);
      if (this.isProviderInScope(def)) {
        if (typeof token === "function") {
          record = InjectorMetadata.typeProviderToRecord(token as Type, this);
        } else {
          record = InjectorMetadata.customProviderToRecord(token, def as any, this);
        }
      }
    }

    return record;
  }

  private getWrappers(
    record: ProviderRecord,
    session?: InjectionSession
  ): Array<WrapperRecord> {
    const wrappers = record.wrappers, w = [];
    for (let i = 0, l = wrappers.length; i < l; i++) {
      const wrapper = wrappers[i];
      if (wrapper.constraint(session) === true) {
        w.push(wrapper);
      }
    }
    return w;
  }

  private getDefinition(
    record: ProviderRecord,
    session?: InjectionSession
  ): DefinitionRecord {
    const defs = record.defs;
    if (defs.length === 0) {
      return record.defaultDef;
    }

    for (let i = defs.length - 1; i > -1; i--) {
      const def = defs[i];
      if (def.constraint(session) === true) {
        return def;
      }
    }
    return record.defaultDef;
  }

  private addProvider(provider: Provider): void {
    InjectorMetadata.toRecord(provider, this);
  }

  private addProviders(providers: Provider[] = []): void {
    for (let i = 0, l = providers.length; i < l; i++) {
      InjectorMetadata.toRecord(providers[i], this);
    }
  }

  // add case with modules, inline modules etc.
  private isProviderInScope(def: ProviderDef): boolean {
    if (def === undefined || def.providedIn === undefined) {
      return false;
    }
    const providedIn = def.providedIn;
    const provideInArray = Array.isArray(providedIn) ? providedIn : [providedIn];
    if (provideInArray.some(s => this.scopes.includes(s))) {
      return true;
    }
  }

  private async processModule<T>(mod: Type<T> | DynamicModule<T> | Promise<DynamicModule> | ForwardRef<T>, modulesStack: Array<Injector>, importer?: Injector) {
    mod = resolveRef(mod);
    if (mod === undefined) {
      return;
    }

    // retrieve module metadata
    // if it's dynamic module, first try to resolve the module metadata
    let moduleDef = getModuleDef(mod), 
      dynamicModuleDef: DynamicModule<T> = undefined,
      isDynamicModule = false;
    if (moduleDef === undefined) {
      dynamicModuleDef = await (mod as Promise<DynamicModule>);
      mod = dynamicModuleDef.module;
      moduleDef = getModuleDef(mod);
      isDynamicModule = true;
    }

    if (moduleDef === undefined) {
      throw new Error(`Given value/type ${mod} cannot be used as ADI Module`);
    }

    const retrievedMod = mod as Type;


    if (isDynamicModule === true) {
      const imports = dynamicModuleDef.imports || []; 
      for (let i = 0, l = imports.length; i < l; i++) {
        // change this to appropriate reference to injector
        await this.processModule(imports[i], modulesStack, this);
      }  
    }

    if (isDynamicModule) {
      this.addProviders(dynamicModuleDef.providers);
      // this.addExports(dynamicModuleDef.exports || EMPTY_ARR, importer);
    }

    // root module
    await this.initModule();
  }

  async initModule(): Promise<void> {
    // resolve INJECTOR_SCOPE provider
    // this.configureScope();

    // first init all providers for MODULE_INITIALIZERS token
    // and if returned value (one of returned) is a function, call this function
    const initializers = await this.get(MODULE_INITIALIZERS);
    let initializer = undefined;
    for (let i = 0, l = initializers.length; i < l; i++) {
      if (typeof (initializer = initializers[i]) === "function") {
        await initializer();
      }
    }

    // // then init all inlined modules for given module
    // for (let i = 0, l = this.inlineModules.length; i < l; i++) {
    //   await this.resolveComponent(this.inlineModules[i]);
    // }

    // // at the end init given module
    // await this.resolveComponent(MODULE as any);
  }
}

export const NilInjector = new class {
  get(token: Token): never {
    const error = new Error(`NilInjector: No provider for ${token as any}!`);
    error.name = 'NilInjectorError';
    throw error;
  }
  retrieveRecord = this.get;

  getParentInjector() {
    return null;
  }
} as unknown as Injector;

export function createInjector(
  injector: Type<any> | ModuleMetadata | Array<Provider> = [],
  parent: Injector = NilInjector,
  options?: InjectorOptions,
): Injector {
  injector = Array.isArray(injector) ? { providers: injector } : injector;
  return new Injector(injector, parent, options);
}
