import { getProviderDef, getModuleDef } from "../decorators";
import { 
  DefinitionRecord, InstanceRecord,
  Provider, Type,
  InjectorOptions, InjectorScopeType, PlainProvider,
  ModuleMetadata, ModuleID, ExportItem, ExportedModule
} from "../interfaces";
import { INJECTOR_SCOPE, MODULE_INITIALIZERS, COMMON_HOOKS, ANNOTATIONS } from "../constants";
import { InjectorStatus, InstanceStatus, SessionStatus } from "../enums";
import { Token } from "../types";
import { resolveRef, handleOnInit, thenable } from "../utils";
import { runWrappers, runArrayOfWrappers, Wrapper } from "../utils/wrappers";

import { Compiler } from "./module-compiler";
import { InjectorMetadata } from "./metadata";
import { InjectorResolver } from "./resolver";
import { ProviderRecord } from "./provider";
import { Session } from "./session";
import { Multi } from "../wrappers";
import { NilInjectorError } from "../errors";
import { DestroyManager } from "./destroy-manager";

export class Injector {
  static create(
    injector: Type<any> | ModuleMetadata | Array<Provider> = [],
    parent: Injector = NilInjector,
    options?: InjectorOptions,
  ): Injector {
    injector = Array.isArray(injector) ? { providers: injector } : injector;
    return new Injector(injector, parent, options);
  }

  static createProto(
    injector: Type<any> | ModuleMetadata | Array<Provider> = [],
    parent: Injector = NilInjector,
    options?: InjectorOptions,
  ): ProtoInjector {
    injector = Array.isArray(injector) ? { providers: injector } : injector;
    return new ProtoInjector(injector, parent, options);
  }

  /**
   * MAKE IT READONLY PRIVATE!
   */
  // change to Map<Type, Map<ModuleID, Injector>> for better optymalization
  // imported modules
  imports = new Map<Type, Injector | Map<ModuleID, Injector>>();
  // components
  components = new Map<Token, ProviderRecord>();
  // own records
  records = new Map<Token, ProviderRecord>();
  // records from imported modules
  importedRecords = new Map<Token, ProviderRecord>();
  // scopes of injector
  scopes: Array<InjectorScopeType> = ['any'];
  // id of injector/module
  id: ModuleID = 'static';
  // status of injector
  status: InjectorStatus = InjectorStatus.NONE;

  constructor(
    // change injector to the metatype
    readonly injector: Type<any> | ModuleMetadata | Array<Provider> = [],
    readonly parent: Injector = NilInjector,
    private readonly options: InjectorOptions = {},
  ) {
    if (options !== undefined) {
      const { setupProviders, scope } = options;
      setupProviders && this.addProviders(options.setupProviders);
      this.id = options.id || this.id;
      scope && this.configureScope(scope);
    }

    if (typeof injector === "function") {
      // resolve INJECTOR_SCOPE provider again - it could be changed in provider array
      this.configureScope();
      // add passed injector (Type or ModuleMetadata) as component
      // TODO: Change to the provider, not component
      this.addComponent(this.injector as any);
    } else {
      this.addProviders(Array.isArray(injector) ? injector : injector.providers);
    }

    this.addCoreProviders();
  }

  /**
   * INJECTOR
   */
  getParent(): Injector {
    return this.parent;
  }

  createChild(
    injector: Type<any> | ModuleMetadata | Array<Provider> = [],
    options?: InjectorOptions,
  ): Injector {
    return createInjector(injector, this, options);
  }

  selectChild(mod: Type, id: ModuleID = 'static'): Injector | undefined {
    let founded = this.imports.get(mod);
    if (founded === undefined) {
      return;
    }
    if (founded instanceof Map) {
      return founded.get(id);
    }
    return founded.id === id ? founded : undefined;
  }

  build(): Injector {
    if (this.status & InjectorStatus.BUILDED) return; 
    this.status |= InjectorStatus.BUILDED;

    if (Array.isArray(this.injector)) return;
    Compiler.build(this);
    return this;
  }

  async buildAsync(): Promise<Injector> {
    if (this.status & InjectorStatus.BUILDED) return; 
    this.status |= InjectorStatus.BUILDED;

    if (Array.isArray(this.injector)) return;
    await Compiler.buildAsync(this);
    return this;
  }

  init(options?: { asyncMode: boolean }) {
    if (this.status & InjectorStatus.INITIALIZED) return; 
    this.status |= InjectorStatus.INITIALIZED;

    // resolve INJECTOR_SCOPE provider again - it can be changed in the provider array
    this.configureScope();

    const asyncMode = options?.asyncMode;
    return thenable(
      // run MODULE_INITIALIZERS
      () => asyncMode ? this.runInitializerAsync() : this.runInitializer(),
      () => {
        if (typeof this.injector !== 'function') return;
        return asyncMode ? this.getComponentAsync(this.injector) : this.getComponent(this.injector);
      }
    );
  }

  async destroy() {
    if (this.status & InjectorStatus.DESTROYED) return; 
    this.status |= InjectorStatus.DESTROYED;

    // destroy and clear own components
    try {
      await DestroyManager.destroyRecords(Array.from(this.components.values()), this);
    } finally {
      this.components.clear();
    }

    // destroy and clear own records
    try {
      await DestroyManager.destroyRecords(Array.from(this.records.values()), this);
    } finally {
      this.records.clear();
    }

    // only clear imported values
    this.importedRecords.clear();

    // remove injector from parent records
    if (this.parent !== NilInjector && typeof this.injector === 'function') {
      const importInParent = this.parent.imports.get(this.injector);
      if (importInParent === undefined) return;
      if (importInParent instanceof Map) {
        importInParent.has(this.id) && importInParent.delete(this.id);
        return;
      }
      this.parent.imports.delete(this.injector);
    }
  }

  /**
   * PROVIDERS
   */
  get<T>(token: Token<T>, wrapper?: Wrapper, session?: Session): T | undefined {
    const options = InjectorMetadata.createOptions(token);
    session = session || new Session(undefined, undefined, undefined, options, undefined, undefined);
    return this.resolveToken(wrapper, session);
  }

  async getAsync<T>(token: Token<T>, wrapper?: Wrapper, session?: Session): Promise<T | undefined> {
    const options = InjectorMetadata.createOptions(token);
    session = session || new Session(undefined, undefined, undefined, options, undefined, undefined);
    session.status |= SessionStatus.ASYNC;
    return this.resolveToken(wrapper, session);
  }

  resolveToken<T>(wrapper: Wrapper, session: Session): T | undefined {
    if (wrapper !== undefined) {
      return runWrappers(wrapper, this, session, lastInjectionWrapper);
    }
    return this.resolveRecord(session);
  }

  resolveRecord<T>(session: Session): T | undefined {
    const token = session.getToken();
    let record: ProviderRecord;
    if (session.status & SessionStatus.COMPONENT_RESOLUTION) {
      record = this.components.get(token);
    } else {
      record = this.getRecord(token);
    }

    if (record === undefined) {
      // Reuse session in the parent
      return this.parent.resolveRecord(session);
    }
    session.record = record;

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
      // Remove assigned record from session 
      session.record = undefined;
      // Reuse session in the parent
      return this.parent.resolveRecord(session);
    }
    session.definition = def;

    if (def.wrapper !== undefined) {
      return runWrappers(def.wrapper, this, session, lastDefinitionWrapper);
    }

    return this.resolveDefinition(def, session);
  }

  resolveDefinition<T>(def: DefinitionRecord<T>, session: Session): T | undefined {
    // check dry run
    if (session.status & SessionStatus.DRY_RUN) {
      return;
    }

    let scope = def.scope;
    if (scope.kind.canBeOverrided() === true) {
      scope = session.options.scope || scope;
    }

    const instance = def.record.getInstance(def, scope, session);
    session.instance = instance;

    return this.resolveInstance(def.record, def, instance, session);
  }

  private resolveInstance<T>(
    record: ProviderRecord<T>,
    def: DefinitionRecord<T>,
    instance: InstanceRecord<T>,
    session?: Session,
  ): T {
    if (instance.status & InstanceStatus.RESOLVED) {
      return instance.value;
    }

    // parallel or circular injection
    if (instance.status > InstanceStatus.UNKNOWN) {
      return InjectorResolver.handleParallelInjection(instance, session) as T;
    }

    instance.status |= InstanceStatus.PENDING;
    return thenable(
      () => def.factory(record.host, session) as T,
      value => {
        if (instance.status & InstanceStatus.CIRCULAR) {
          value = Object.assign(instance.value, value);
        }
        instance.value = value;

        handleOnInit(instance, session);

        instance.status |= InstanceStatus.RESOLVED;
        instance.doneResolve && instance.doneResolve(value);
        return instance.value;
      }
    ) as unknown as T;
  }

  getRecord<T>(
    token: Token<T>,
  ): ProviderRecord {
    let record = this.records.get(token) || this.importedRecords.get(token);

    // check for treeshakable provider - `providedIn` case
    if (record === undefined) {
      const def = getProviderDef(token);
      const provideIn = def?.options?.provideIn;
      if (provideIn === undefined) {
        return;
      }

      if (this.isProviderInScope(provideIn)) {
        if (typeof token === "function") { // type provider case
          record = InjectorMetadata.typeProviderToRecord(token as Type, this);
        } else { // injection token case
          record = InjectorMetadata.customProviderToRecord(token, def as any, this);
        }
      } else { // imports case
        const annotations = def?.options?.annotations;
        if (annotations[ANNOTATIONS.EXPORT] !== true) {
          return;
        }

        this.imports.forEach(imp => {
          if (imp instanceof Map) {
            // TODO: implement this
          } else {
            if (imp.isProviderInScope(provideIn)) {
              if (typeof token === "function") { // type provider case
                record = InjectorMetadata.typeProviderToRecord(token as Type, imp);
              } else { // injection token case
                record = InjectorMetadata.customProviderToRecord(token, def as any, imp);
              }
              this.importedRecords.set(token, record);
            }
          }
        });
        return record;
      }
    }

    return record;
  }

  addProvider(provider: Provider): void {
    provider && InjectorMetadata.toRecord(provider, this);
  }

  addProviders(providers: Provider[] = []): void {
    for (let i = 0, l = providers.length; i < l; i++) {
      InjectorMetadata.toRecord(providers[i], this);
    }
  }

  // TODO: add case with imported modules
  private isProviderInScope(provideIn?: InjectorScopeType | InjectorScopeType[]): boolean {
    if (Array.isArray(provideIn)) {
      return provideIn.some(scope => this.scopes.includes(scope));
    }
    return this.scopes.includes(provideIn);
  }

  private configureScope(scopes?: InjectorScopeType | Array<InjectorScopeType>): void {
    this.scopes = ["any", this.injector as any];
    scopes = scopes || this.get(INJECTOR_SCOPE, COMMON_HOOKS.OptionalSelf) as Array<InjectorScopeType>;
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
    this.addProviders([
      { provide: Injector, useValue: this },
      { provide: MODULE_INITIALIZERS, useWrapper: Multi() }
    ]);
  }

  private runInitializer() {
    const initializers = this.get(MODULE_INITIALIZERS, COMMON_HOOKS.OptionalSelf) || [];
    let initializer = undefined;
    for (let i = 0, l = initializers.length; i < l; i++) {
      initializer = initializers[i];
      if (typeof initializer === "function") {
        initializer();
      }
    }
  }

  private async runInitializerAsync() {
    const initializers = (await this.getAsync(MODULE_INITIALIZERS, COMMON_HOOKS.OptionalSelf)) || [];
    let initializer = undefined;
    for (let i = 0, l = initializers.length; i < l; i++) {
      initializer = await initializers[i];
      if (typeof initializer === "function") {
        await initializer();
      }
    }
  }

  /**
   * COMPONENTS
   */
  getComponent<T>(token: Token<T>, wrapper?: Wrapper): T | undefined {
    if (this.components.get(token) === undefined) {
      throw Error(`Given component of ${String(token)} type doesn't exists`);
    }

    const options = InjectorMetadata.createOptions(token);
    const session = new Session(undefined, undefined, undefined, options, undefined, undefined);
    session.status |= SessionStatus.COMPONENT_RESOLUTION; 
    return this.resolveToken(wrapper, session);
  }

  getComponentAsync<T>(token: Token<T>, wrapper?: Wrapper): Promise<T | undefined> {
    if (this.components.get(token) === undefined) {
      throw Error(`Given component of ${String(token)} type doesn't exists`);
    }

    const options = InjectorMetadata.createOptions(token);
    const session = new Session(undefined, undefined, undefined, options, undefined, undefined);
    session.status |= SessionStatus.COMPONENT_RESOLUTION; 
    session.status |= SessionStatus.ASYNC;
    return this.resolveToken(wrapper, session);
  }

  addComponent(component: Type): void {
    typeof component === 'function' && InjectorMetadata.toRecord(component, this, true);
  }

  addComponents(components: Type[] = []): void {
    for (let i = 0, l = components.length; i < l; i++) {
      this.addComponent(components[i]);
    }
  }

  /**
   * EXPORTS
   */
  processExports(exps: Array<ExportItem>, from: Injector, to: Injector): void {
    if (exps === undefined || to === NilInjector) return;
    for (let i = 0, l = exps.length; i < l; i++) {
      this.processExport(exps[i], from, to);
    }
  }

  private processExport(exp: ExportItem, from: Injector, to: Injector): void {
    exp = resolveRef(exp);

    // export can be module definition
    if (typeof exp === "function") {
      const moduleDef = getModuleDef(exp);

      // operate on Module
      if (moduleDef !== undefined) {
        this.processModuleExport(exp as Type, 'static', from, to);
        return;
      }
    }

    // operate on DynamicModule
    if ((exp as ExportedModule).module) {
      const { module, id, providers } = (exp as ExportedModule);
      this.processModuleExport(module, id || 'static', from, to, providers);
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

  private processModuleExport(mod: Type, id: ModuleID, from: Injector, to: Injector, providers?: Array<Provider | Token>) {
    if (from.imports.has(mod) === false) {
      throw Error(`cannot export from ${mod} module`);
    }

    let fromModule = from.imports.get(mod);
    if (fromModule instanceof Map) {
      fromModule = fromModule.get(id);
    }

    if (providers === undefined) {
      from.importedRecords.forEach((record, token) => {
        if (record.host === fromModule) to.importedRecords.set(token, record);
      });
    } else {
      from.importedRecords.forEach((record, token) => {
        if (record.host === fromModule) {
          const givenToken = providers.some(prov => prov === token || (prov as PlainProvider).provide === token);
          givenToken && to.importedRecords.set(token, record);
        }
      });
    }
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

class ProtoInjector extends Injector {
  private stack: Injector[] = [];

  build(): ProtoInjector {
    if (this.status & InjectorStatus.BUILDED) return; 
    this.status |= InjectorStatus.BUILDED;

    if (Array.isArray(this.injector)) return;
    this.stack = Compiler.build(this, true);
    return this;
  }

  async buildAsync(): Promise<ProtoInjector> {
    if (this.status & InjectorStatus.BUILDED) return; 
    this.status |= InjectorStatus.BUILDED;

    if (Array.isArray(this.injector)) return;
    this.stack = await Compiler.buildAsync(this, true);
    return this;
  }

  fork(): Injector {
    // Map<old Injector, new Injector>
    const injectorMap = new Map<Injector, Injector>();
    const newInjector = this.cloneInjector(this, injectorMap);

    const newStack = this.stack.map(oldInjector => injectorMap.get(oldInjector));
    Compiler.initModules(newStack);
    return newInjector;
  }

  async forkAsync(): Promise<Injector> {
    // Map<old Injector, new Injector>
    const injectorMap = new Map<Injector, Injector>();
    const newInjector = this.cloneInjector(this, injectorMap);

    const newStack = this.stack.map(oldInjector => injectorMap.get(oldInjector));
    await Compiler.initModulesAsync(newStack);
    return newInjector;
  }

  private cloneInjector(oldInjector: Injector, injectorMap: Map<Injector, Injector>): Injector {
    const newInjector = Object.assign(Object.create(Injector.prototype) as Injector, oldInjector);
    injectorMap.set(oldInjector, newInjector);

    // create copy of the existing injectors in the subgraph
    const newImports = new Map<Type, Injector | Map<ModuleID, Injector>>();
    oldInjector.imports.forEach((injector, type) => {
      if (injector instanceof Map) {
        const newMap = new Map<ModuleID, Injector>();
        newImports.set(type, newMap);
        injector.forEach((injectorWithID, id) => {
          newMap.set(id, this.cloneInjector(injectorWithID, injectorMap));
        });
      } else {
        newImports.set(type, this.cloneInjector(injector, injectorMap));
      }
    });

    // copy components
    newInjector.components = new Map();
    oldInjector.components.forEach((component, token) => newInjector.components.set(token, this.cloneProviderRecord(component, newInjector)));
    
    // copy records
    newInjector.records = new Map();
    oldInjector.records.forEach((provider, token) => newInjector.records.set(token, this.cloneProviderRecord(provider, newInjector)));
    
    // copy imported records
    newInjector.importedRecords = new Map();
    oldInjector.importedRecords.forEach((provider, token) => newInjector.importedRecords.set(token, injectorMap.get(provider.host).records.get(token)));

    return newInjector;
  }

  private cloneProviderRecord(provider: ProviderRecord, newInjector: Injector): ProviderRecord {
    const newProvider = new ProviderRecord(provider.token, newInjector, provider.isComponent);
    newProvider.defs = provider.defs.map(def => ({ ...def, record: newProvider, values: new Map() }));
    newProvider.constraintDefs = provider.constraintDefs.map(def => ({ ...def, record: newProvider, values: new Map() }));
    newProvider.wrappers = provider.wrappers.map(wrapper => ({ ...wrapper }));
    return newProvider;
  }
}

export const NilInjector = new class {
  get(token: Token): never {
    throw new NilInjectorError(token);
  }
  resolveRecord(session: Session) {
    this.get(session.getToken());
  };
  getParent() {
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
