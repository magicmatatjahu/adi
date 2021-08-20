import { getProviderDef, getModuleDef } from "../decorators";
import { 
  InjectionOptions, InjectionMetadata,
  DefinitionRecord, InstanceRecord, ComponentRecord,
  Provider, ProviderDef, Type, ForwardRef,
  InjectorOptions, InjectorScopeType, ModuleMetadata, DynamicModule, ModuleID, CompiledModule, ExportedModule, PlainProvider,
} from "../interfaces";
import { INJECTOR_SCOPE, MODULE_INITIALIZERS, EMPTY_OBJECT, EMPTY_ARRAY } from "../constants";
import { InjectionStatus } from "../enums";
import { Token } from "../types";
import { resolveRef } from "../utils";
import { runWrappers, runArrayOfWrappers, Wrapper } from "../utils/wrappers";

import { InjectorMetadata } from "./metadata";
import { InjectorResolver } from "./resolver";
import { ProviderRecord } from "./provider";
import { Session } from "./session";
import { Multi, Optional, Self } from "../wrappers";
import { NilInjectorError } from "../errors";

export class Injector {
  // TODO: Change to Array not Map<ModuleID, Injector> 
  // imported modules
  private imports = new Map<Type, Injector | Map<ModuleID, Injector>>();
  // components
  private readonly components = new Map<Type, ComponentRecord>();
  // own records
  private readonly records = new Map<Token, ProviderRecord>();
  // records from imported modules
  private readonly importedRecords = new Map<Token, ProviderRecord>();
  // scopes of injector
  private scopes: Array<InjectorScopeType> = ['any'];
  // id of injector/module
  private id: ModuleID = 'static';

  constructor(
    private readonly injector: Type<any> | ModuleMetadata | Array<Provider> = [],
    private readonly parent: Injector = NilInjector,
    private readonly options: InjectorOptions = {},
  ) {
    if (options !== undefined) {
      const { setupProviders, scope } = options;
      setupProviders !== undefined && this.addProviders(options.setupProviders);
      this.id = options.id || this.id;
      scope && this.configureScope(scope);
    }

    if (typeof injector === "function") {
      // resolve INJECTOR_SCOPE provider again - it could be changed in provider array
      this.configureScope();
      // add passed injector (Type or ModuleMetadata) as component
      this.addComponent(this.injector as any);
    } else {
      this.addProviders(Array.isArray(injector) ? injector : injector.providers);
    }

    this.addCoreProviders();
  }

  /**
   * INJECTOR
   */
  getParentInjector(): Injector {
    return this.parent;
  }

  async compile(): Promise<Injector> {
    if (Array.isArray(this.injector)) return;

    const compiledModule = await this.compileModuleMetadata(this.injector);
    compiledModule.injector = this;
    compiledModule.exportTo = this.parent;
    const stack: Array<Injector> = [this];
    await this.processModule(compiledModule, stack);

    await this.initModules(stack);
    return this;
  }

  select(mod: Type, id: ModuleID = 'static'): Injector | undefined {
    let founded = this.imports.get(mod);
    if (founded instanceof Map) {
      return founded.get(id);
    }
    return founded.id === id ? founded : undefined;
  }

  /**
   * PROVIDERS
   */
  get<T>(token: Token<T>, wrapper?: Wrapper, session?: Session): T | undefined {
    return this.privateGet(token, wrapper, undefined, session) as T | undefined;
  }

  async getAsync<T>(token: Token<T>, wrapper?: Wrapper, session?: Session): Promise<T | undefined> {
    return this.privateGet(token, wrapper, undefined, session) as T | undefined;
  }

  privateGet<T>(token: Token, wrapper: Wrapper, meta?: InjectionMetadata, parentSession?: Session): T | undefined {
    const options = InjectorMetadata.createOptions(token);
    const newSession = new Session(undefined, undefined, undefined, options, meta, parentSession);

    if (wrapper !== undefined) {
      return runWrappers(wrapper, this, newSession, lastInjectionWrapper);
    }

    return this.resolveRecord(newSession);
  }

  resolveRecord<T>(session?: Session): T | undefined {
    const token = session.getToken();
    const record = this.getRecord(token);

    if (record === undefined) {
      // Reuse session in the parent
      return this.parent.resolveRecord(session);
    }
    session.setRecord(record);

    const providerWrappers = record.filterWrappers(session);
    if (providerWrappers.length > 0) {
      return runArrayOfWrappers(providerWrappers, record.host, session, lastProviderWrapper);
    }

    return this.getDefinition(session);
  }

  getDefinition<T>(session: Session): T | undefined {
    const record = session.record;
    const def = record.getDefinition(session);

    if (def === undefined) {
      // Reuse session in the parent
      return this.parent.resolveRecord(session);
    }
    session.setDefinition(def);

    if (def.wrapper !== undefined) {
      return runWrappers(def.wrapper, this, session, lastDefinitionWrapper);
    }

    return this.resolveDefinition(def, session);
  }

  resolveDefinition<T>(def: DefinitionRecord<T>, session: Session): T | undefined {
    let scope = def.scope;
    if (scope.kind.canBeOverrided() === true) {
      scope = session.options.scope || scope;
    }

    const instance = def.record.getInstance(def, scope, session);
    session.setInstance(instance);

    return this.resolveInstance(def.record, def, instance, session);
  }

  private resolveInstance<T>(
    record: ProviderRecord<T>,
    def: DefinitionRecord<T>,
    instance: InstanceRecord<T>,
    session?: Session,
  ): T {
    if (instance.status & InjectionStatus.RESOLVED) {
      return instance.value;
    }

    if (instance.status === InjectionStatus.UNKNOWN) {
      instance.status |= InjectionStatus.PENDING;

      const value = def.factory(record.host, session) as T;
      if (instance.status & InjectionStatus.CIRCULAR) {
        // merge of instance is done in OnInitHook wrapper
        Object.assign(instance.value, value);
      } else {
        instance.value = value;
      }

      instance.status |= InjectionStatus.RESOLVED;
      return instance.value;
    }

    // Circular case
    return InjectorResolver.handleCircularRefs(instance, session);
  }

  private getRecord<T>(
    token: Token<T>,
  ): ProviderRecord {
    let record = this.records.get(token) || this.importedRecords.get(token);

    // check for treeshakable provider - `providedIn` case
    if (record === undefined) {
      const def = getProviderDef(token);
      if (this.isProviderInScope(def)) {
        if (typeof token === "function") { // type provider case
          record = InjectorMetadata.typeProviderToRecord(token as Type, this);
        } else { // injection token case
          record = InjectorMetadata.customProviderToRecord(token, def as any, this);
        }
      }
    }

    return record;
  }

  addProvider(provider: Provider): void {
    InjectorMetadata.toRecord(provider, this);
  }

  addProviders(providers: Provider[] = []): void {
    for (let i = 0, l = providers.length; i < l; i++) {
      InjectorMetadata.toRecord(providers[i], this);
    }
  }

  // TODO: add case with imported modules
  private isProviderInScope(def: ProviderDef): boolean {
    const provideIn = def && def.options && def.options.provideIn;
    if (provideIn === undefined) {
      return false;
    }
    const provideInArray = Array.isArray(provideIn) ? provideIn : [provideIn];
    return provideInArray.some(s => this.scopes.includes(s));
  }

  /**
   * COMPONENTS
   */
  getComponent<T>(token: Type<T>, options?: InjectionOptions, meta?: InjectionMetadata, session?: Session): Promise<T | undefined> | T | undefined {
    const component = this.components.get(token);
    if (component === undefined) {
      throw Error(`Given component of ${token} type doesn't exists`);
    }

    options = InjectorMetadata.createOptions(token);
    const newSession = new Session(undefined, undefined, undefined, options, meta, session);

    // const wrapper = options && options.wrapper;
    // if (wrapper) {
    //   const last = (i: Injector, s: Session) => i.resolveComponent(component, s.options, s);
    //   return runWrappers(wrapper, this, session, last);
    // }

    return this.resolveComponent(component, options, newSession);
  }

  private resolveComponent<T>(comp: ComponentRecord<T>, options?: any, session?: Session): Promise<T | undefined> | T | undefined {
    let scope = comp.scope;
    if (scope.canBeOverrided() === true) {
      scope = options.scope || scope;
    }
    const instance = InjectorMetadata.getComponentInstanceRecord(comp, scope, session);
    return instance.value || (instance.value = comp.factory(this, session) as any);
  }

  addComponent(component: Type): void {
    const record = InjectorMetadata.toComponentRecord(component, this);
    this.components.set(component, record);
  }

  addComponents(components: Type[] = []): void {
    for (let i = 0, l = components.length; i < l; i++) {
      this.addComponent(components[i]);
    }
  }

  /**
   * EXPORTS
   */
  private processExports(exps: Array<
    | Token
    | Provider
    | ExportedModule
    | ForwardRef
  >, from: Injector, to: Injector): void {
    if (exps === undefined || to === NilInjector) return;
    for (let i = 0, l = exps.length; i < l; i++) {
      this.processExport(exps[i], from, to);
    }
  }

  private processExport(exp:
    | Token
    | Provider
    | ExportedModule
    | ForwardRef
  , from: Injector, to: Injector): void {
    exp = resolveRef(exp);

    if (typeof exp === "function") {
      // export can be module definition
      const moduleDef = getModuleDef(exp);

      // operate on Module
      if (moduleDef !== undefined) {
        this.processModuleExport(exp as Type, 'static', undefined, from, to);
        return;
      }
    }

    // operate on DynamicModule
    if ((exp as unknown as DynamicModule).module) {
      const { module, id, providers } = (exp as unknown as DynamicModule);
      this.processModuleExport(module, id || 'static', providers, from, to);
      return;
    }

    // Token, Provider and InjectionToken case
    // import also imported records
    const token: any = (exp as PlainProvider).provide || exp;
    const record = from.getRecord(token);
    if (record !== undefined) {
      to.importedRecords.set(token, record);
    }
  }

  private processModuleExport(mod: Type, id: ModuleID, providers: Array<Provider | Token>, parent: Injector, to: Injector) {
    if (parent.imports.has(mod) === false) {
      throw Error(`cannot export from ${mod} module`);
    }

    let fromModule = parent.imports.get(mod);
    if (fromModule instanceof Map) {
      fromModule = fromModule.get(id);
    }

    if (providers === undefined) {
      parent.importedRecords.forEach((record, token) => {
        if (record.host === fromModule) to.importedRecords.set(token, record);
      });
    } else {
      parent.importedRecords.forEach((record, token) => {
        if (record.host === fromModule) {
          const givenToken = providers.some(p => p === token || (p as PlainProvider).provide === token);
          givenToken && to.importedRecords.set(token, record);
        }
      });
    }
  }

  /**
   * IMPORTS
   */
  private async processModule<T>({ moduleDef, dynamicDef, injector, exportTo, isFacade }: CompiledModule, stack: Array<Injector>) {
    // for facade performs only acitions on dynamicDef. Performing action when is facade on moduleDef might end up overwriting some providers
    const compiledModules: Array<CompiledModule> = [];

    // first iterate in all imports and create injectors for given modules
    let imports = moduleDef.imports || EMPTY_ARRAY;
    if (isFacade === false) {
      for (let i = 0, l = imports.length; i < l; i++) {
        await this.processImport(imports[i], compiledModules, injector, stack);
      }
    }
    imports = (dynamicDef && dynamicDef.imports) || EMPTY_ARRAY;
    for (let i = 0, l = imports.length; i < l; i++) {
      await this.processImport(imports[i], compiledModules, injector, stack);
    }

    // first process all imports and go more depper in modules graph
    for (let i = 0, l = compiledModules.length; i < l; i++) {
      await this.processModule(compiledModules[i], stack);
    }

    if (isFacade === false) {
      injector.addProviders(moduleDef.providers);
      injector.addComponents(moduleDef.components);
      injector.processExports(moduleDef.exports, injector, exportTo);
    }
    if (dynamicDef !== undefined) {
      injector.addProviders(dynamicDef.providers);
      injector.addComponents(dynamicDef.components);
      injector.processExports(dynamicDef.exports, injector, exportTo);
    }
  }

  private async processImport<T = any>(
    imp: Type<T> | ModuleMetadata | DynamicModule<T> | Promise<DynamicModule> | ForwardRef<T>,
    compiledModules: Array<CompiledModule>,
    parentInjector: Injector,
    stack: Array<Injector>,
  ) {
    const processedModule = await this.compileModuleMetadata(imp);
    if (processedModule === undefined) return;

    const { mod, dynamicDef } = processedModule;
    const id = (dynamicDef && dynamicDef.id) || 'static';
    
    let injector: Injector, foundedInjector = this.findModule(parentInjector, mod, id);
    if (foundedInjector === undefined) {
      injector = createInjector(mod, parentInjector, { id });

      processedModule.injector = injector;
      processedModule.exportTo = parentInjector;

      stack.push(injector);
    } else {
      // check also here circular references between modules

      // make facade
      const facadeInjector = createInjector(mod, foundedInjector, { id });
      processedModule.injector = facadeInjector;
      processedModule.exportTo = parentInjector;
      processedModule.isFacade = true;
      injector = facadeInjector;

      // don't push facade to the `stack` array
    }
    compiledModules.push(processedModule as any);

    if (parentInjector.imports.has(mod)) {
      const modules = parentInjector.imports.get(mod);

      // when modules is a map not a single injector
      if (modules instanceof Map) {
        modules.set(id, injector);
      } else {
        const map = new Map();
        parentInjector.imports.set(mod, map);
        map.set(modules.id, modules)
      }
    } else {
      parentInjector.imports.set(mod, injector);
    }

    // TODO: Checks also exported modules in imports
  }

  private async compileModuleMetadata<T>(mod: Type<T> | ModuleMetadata | DynamicModule<T> | Promise<DynamicModule> | ForwardRef<T>): Promise<CompiledModule> {
    mod = resolveRef(mod);
    if (!mod) return;

    // retrieve module metadata
    // if it's dynamic module, first try to resolve the module metadata
    let moduleDef = getModuleDef(mod), 
      dynamicDef: DynamicModule<T> = undefined;
    if (moduleDef === undefined) {
      dynamicDef = await (mod as Promise<DynamicModule>);
      mod = dynamicDef.module;
      if (mod !== undefined) moduleDef = getModuleDef(mod);
    }

    if (moduleDef === undefined && dynamicDef === undefined) {
      throw new Error(`Given value/type ${mod} cannot be used as ADI Module`);
    }
    return { mod: mod as Type, moduleDef: moduleDef || EMPTY_OBJECT, dynamicDef, injector: undefined, exportTo: undefined, isFacade: false };
  }

  private async initModule(): Promise<void> {
    // resolve INJECTOR_SCOPE provider again - it can be changed in provider array
    this.configureScope();

    // init all providers for MODULE_INITIALIZERS token
    // and if returned value (one of returned) is a function, call this function
    if (this.records.has(MODULE_INITIALIZERS)) {
      // console.log(this.get(MODULE_INITIALIZERS))
      // const initializers = await this.get(MODULE_INITIALIZERS);
      // let initializer = undefined;
      // for (let i = 0, l = initializers.length; i < l; i++) {
      //   if (typeof (initializer = initializers[i]) === "function") {
      //     await initializer();
      //   }
      // }
    }

    // at the end init given module
    typeof this.injector === 'function' && this.getComponent(this.injector as any);
  }

  private async initModules(stack: Array<Injector>): Promise<void> {
    for (let i = 0, l = stack.length; i < l; i++) {
      await stack[i].initModule();
    }
  }

  // injector is here for searching in his parent and more depper
  private findModule(injector: Injector, mod: Type, id: ModuleID): Injector | undefined {
    if (mod === injector.injector) {
      // TODO: Check this statement - maybe error isn't needed
      // throw Error('Cannot import this same module to injector');
      console.log('Cannot import this same module to injector');
      return undefined;
    }

    let foundedModule = injector.imports.get(mod);
    if (foundedModule) {
      if (foundedModule instanceof Map && foundedModule.has(id)) {
        return foundedModule.get(id);
      } else if ((foundedModule as Injector).id === id) {
        return foundedModule as Injector;
      }
    }

    let parentInjector = injector.getParentInjector();
    // Change this statement in the future as CoreInjector - ADI should read imports from CoreInjector
    while (parentInjector !== NilInjector) {
      // TODO: Check this statement - maybe it's needed
      if (mod === parentInjector.injector) {
        return parentInjector as Injector;
      }
      foundedModule = parentInjector.imports.get(mod);

      if (foundedModule) {
        if (foundedModule instanceof Map && foundedModule.has(id)) {
          return foundedModule.get(id);
        } else if ((foundedModule as Injector).id === id) {
          return foundedModule as Injector;
        }
      }
      parentInjector = parentInjector.getParentInjector();
    }
    return undefined;
  }

  private configureScope(scopes?: InjectorScopeType | Array<InjectorScopeType>): void {
    this.scopes = ["any", this.injector as any];
    scopes = scopes || this.get(INJECTOR_SCOPE, Optional(Self())) as Array<InjectorScopeType>;
    if (scopes === undefined) return;
    if (Array.isArray(scopes)) {
      for (let i = 0, l = scopes.length; i < l; i++) {
        this.scopes.push(scopes[i]);
      }  
    } else {
      this.scopes.push(scopes);
    }
  }

  private addCoreProviders() {
    // add Injector as self provider
    this.addProvider({ provide: Injector, useValue: this });
    this.addProvider({ provide: MODULE_INITIALIZERS, useWrapper: Multi() });
  }
}

function lastInjectionWrapper(injector: Injector, session: Session) {
  return injector.resolveRecord(session);
}

function lastProviderWrapper(injector: Injector, session: Session) {
  return injector.getDefinition(session);
}

function lastDefinitionWrapper(injector: Injector, session: Session) {
  const def = session.definition;
  return injector.resolveDefinition(def, session);
}

export const NilInjector = new class {
  get(token: Token): never {
    throw new NilInjectorError(token);
  }
  resolveRecord = this.get;

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
