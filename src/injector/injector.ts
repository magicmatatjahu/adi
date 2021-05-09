import { getProviderDef, getModuleDef } from "../decorators";
import { 
  InjectionOptions, InjectionSession,
  ProviderRecord, WrapperRecord, DefinitionRecord, InstanceRecord, ComponentRecord,
  Provider, ProviderDef, WrapperDef, NextWrapper, Type,
  InjectorOptions, InjectorScopeType, ModuleMetadata, DynamicModule, ModuleDef, ModuleID,
  ForwardRef,
} from "../interfaces";
import { INJECTOR_SCOPE, MODULE_INITIALIZERS } from "../constants";
import { InjectionStatus, ScopeFlags } from "../enums";
import { Token } from "../types";
import { resolveRef } from "../utils";

import { Context } from "./context";
import { InjectorMetadata } from "./metadata";
import { Optional } from "../wrappers";

export class Injector {
  // imported modules
  //private readonly imports = new Map<Type, Map<Context, InjectorRecord>>();
  private readonly imports = new Map<Type, Map<Context, Injector>>();
  // components
  private readonly components = new Map<Type, ComponentRecord>();
  // own records
  private readonly records = new Map<Token, ProviderRecord>();
  // records from imported modules
  private readonly importedRecords = new Map<Token, ProviderRecord>();
  // scopes of injector
  private scopes: Array<InjectorScopeType> = ['any'];
  // id of injector/module
  private id: ModuleID= 'static';

  constructor(
    private readonly injector: Type<any> | ModuleMetadata | Array<Provider> = [],
    private readonly parent: Injector = NilInjector,
    private readonly options: InjectorOptions = {},
  ) {
    if (options !== undefined) {
      const { setupProviders, scope } = options;
      setupProviders !== undefined && this.addProviders(options.setupProviders);
      this.id = options.id || this.id;
      if (scope !== undefined) {
        Array.isArray(scope) ? this.scopes.push(...scope) : this.scopes.push(scope);
      }
    }

    if (typeof injector === "function") {
      // resolve INJECTOR_SCOPE provider again - it could be changed in provider array
      this.configureScope();
      // add passed injector (Type or ModuleMetadata) as component
      this.addComponent(this.injector as any);
    } else {
      this.addProviders(Array.isArray(injector) ? injector : injector.providers);
    }

    // add Injector as self provider
    this.addProvider({ provide: Injector, useValue: this });
  }

  getParentInjector(): Injector {
    return this.parent;
  }

  compile(): Promise<Injector> {
    if (!Array.isArray(this.injector)) {
      return this.processModule(this.injector, []);
    }
  }

  /*
   * PROVIDERS
   */
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

  addProvider(provider: Provider): void {
    InjectorMetadata.toRecord(provider, this);
  }

  addProviders(providers: Provider[] = []): void {
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

  /*
   * COMPONENTS
   */
  getComponent<T>(token: Type<T>, options?: any, session?: InjectionSession): Promise<T | undefined> | T | undefined {
    const component = this.components.get(token);
    if (component === undefined) {
      throw Error(`Given component of ${token} type doesn't exists`);
    }

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
      const next: NextWrapper = (i: Injector, s: InjectionSession) => i.resolveComponent(component, s.options, s);
      return nextWrapper(injector, s, next);
    }
    if (wrapper) {
      return nextFn(wrapper)(this, newSession);
    }

    return this.resolveComponent(component, options, newSession);
  }

  private resolveComponent<T>(comp: ComponentRecord<T>, options?: any, session?: InjectionSession): Promise<T | undefined> | T | undefined {
    let scope = comp.scope;
    if (scope.flags & ScopeFlags.CAN_OVERRIDE) {
      scope = options.scope || scope;
    }
    const instance = InjectorMetadata.getComponentInstanceRecord(comp, scope, session);
    return instance.value || (instance.value = comp.factory(this, session) as any);
  }

  addComponent(component: Type): void {
    const record = InjectorMetadata.toComponentRecord(component);
    this.components.set(component, record);
  }

  addComponents(components: Type[] = []): void {
    for (let i = 0, l = components.length; i < l; i++) {
      this.addComponent(components[i]);
    }
  }

  /*
   * IMPORTS
   */
  private async processModule<T>(mod: Type<T> | ModuleMetadata | DynamicModule<T> | Promise<DynamicModule> | ForwardRef<T>, modulesStack: Array<Injector>, importer?: Injector): Promise<Injector> {
    // retrieve module metadata
    // if it's dynamic module, first try to resolve the module metadata
    let moduleDef = getModuleDef(mod), 
      dynamicModuleDef: DynamicModule<T> = undefined;
    if (moduleDef === undefined) {
      dynamicModuleDef = await (mod as Promise<DynamicModule>);
      mod = dynamicModuleDef.module;
      if (mod !== undefined) moduleDef = getModuleDef(mod);
    }

    // // imports modules from moduleDef
    // const imports = moduleDef.imports || [];
    // for (let i = 0, l = imports.length; i < l; i++) {
    //   const [mod, def, dynamicDef] = await this.compileModuleMetadata(imports[i]);
    //   // TODO: Add context as third argument
    //   const injectorRecord = this.findModule(this, mod, dynamicDef.context || STATIC_CONTEXT);

    //   if (injectorRecord === undefined) { // if injector isn't in injectors tree
    //     const newInjector = createInjector(mod, this);
    //   } else { // if injector is in injectors tree

    //   }
    // }

    // const retrievedMod = mod as Type;

    // if (dynamicModuleDef !== undefined) {
    //   const imports = dynamicModuleDef.imports || []; 
    //   for (let i = 0, l = imports.length; i < l; i++) {
    //     // change this to appropriate reference to injector
    //     await this.processModule(imports[i], modulesStack, this);
    //   }  
    // }

    if (moduleDef !== undefined) {
      this.addProviders(moduleDef.providers);
      this.addComponents(moduleDef.components);
    }

    if (dynamicModuleDef !== undefined) {
      this.addProviders(dynamicModuleDef.providers);
      this.addComponents(dynamicModuleDef.components);
    }

    // init module - create instance of given module
    await this.initModule();
    return this;
  }

  // temporary function
  async compileModuleMetadata<T>(mod: Type<T> | DynamicModule<T> | Promise<DynamicModule> | ForwardRef<T>): Promise<[Type, ModuleDef, DynamicModule]> {
    mod = resolveRef(mod);
    if (!mod) {
      throw new Error(`Given value/type ${mod} cannot be used as ADI Module`);
    }

    // retrieve module metadata
    // if it's dynamic module, first try to resolve the module metadata
    let moduleDef = getModuleDef(mod), 
      dynamicModuleDef: DynamicModule<T> = undefined;
    if (moduleDef === undefined) {
      dynamicModuleDef = await (mod as Promise<DynamicModule>);
      mod = dynamicModuleDef.module;
      if (mod !== undefined) moduleDef = getModuleDef(mod);
    }

    if (moduleDef === undefined) {
      throw new Error(`Given value/type ${mod} cannot be used as ADI Module`);
    }
    return [mod as Type, moduleDef, dynamicModuleDef];
  }

  async initModule(): Promise<void> {
    // resolve INJECTOR_SCOPE provider again - it can be changed in provider array
    this.configureScope();

    // init all providers for MODULE_INITIALIZERS token
    // and if returned value (one of returned) is a function, call this function
    const initializers = await this.get(MODULE_INITIALIZERS);
    let initializer = undefined;
    for (let i = 0, l = initializers.length; i < l; i++) {
      if (typeof (initializer = initializers[i]) === "function") {
        await initializer();
      }
    }

    // at the end init given module
    typeof this.injector === 'function' && await this.getComponent(this.injector as any);
  }

  // injector is here for searching in his parent and more depper
  findModule(injector: Injector, mod: Type, ctx: Context): Injector | undefined {
    if (mod === injector.injector) {
      // TODO: Check this statement - maybe error isn't needed
      // throw Error('Cannot import this same module to injector');
      console.log('Cannot import this same module to injector');
      return undefined;
    }

    let foundedModule = injector.imports.get(mod);
    if (foundedModule && foundedModule.has(ctx)) {
      return foundedModule.get(ctx);
    }

    let parentInjector = injector.getParentInjector();
    // Change this statement in the future as CoreInjector - ADI should read imports from CoreInjector
    while (parentInjector !== NilInjector) {
      // TODO: Check this statement - maybe it's needed
      if (mod === parentInjector.injector) {
        return parentInjector as Injector;
      }
      if ((foundedModule = parentInjector.imports.get(mod)) && foundedModule.has(ctx)) {
        return foundedModule.get(ctx);
      }
      parentInjector = parentInjector.getParentInjector();
    }
    return undefined;
  }

  // IMPLEMENTATION BASED ON INJECTOR_RECORD, NOT INJECTOR
  // // injector is here for searching in his parent and more depper
  // findModule(injector: Injector, mod: Type, ctx: Context): InjectorRecord | undefined {
  //   if (mod === injector.injector) {
  //     // TODO: Check this statement - maybe error isn't needed
  //     throw Error('Cannot import this same module to injector');
  //   }

  //   let foundedModule = injector.imports.get(mod);
  //   if (foundedModule && foundedModule.has(ctx)) {
  //     return foundedModule.get(ctx);
  //   }

  //   let parentInjector = injector.getParentInjector();
  //   while (parentInjector !== NilInjector) {
  //     // TODO: Check this statement - maybe it's needed
  //     // if (mod === parentInjector.injector) {
  //     //   return parentInjector.injector as Type;
  //     // }
  //     if ((foundedModule = parentInjector.imports.get(mod)) && foundedModule.has(ctx)) {
  //       return foundedModule.get(ctx);
  //     }
  //     parentInjector = parentInjector.getParentInjector();
  //   }
  //   if (foundedModule && foundedModule.has(ctx)) {
  //     return foundedModule.get(ctx);
  //   }
  //   return undefined;
  // }

  private configureScope(): void {
    this.scopes = ["any", this.injector as any];
    const scopes = this.get(INJECTOR_SCOPE) as InjectorScopeType;
    if (Array.isArray(scopes)) {
      for (let i = 0, l = scopes.length; i < l; i++) {
        this.scopes.push(scopes[i]);
      }  
    } else {
      this.scopes.push(scopes);
    }
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
