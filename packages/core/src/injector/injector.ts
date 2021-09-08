import { getProviderDef, getModuleDef } from "../decorators";
import { 
  InjectionOptions, InjectionMetadata,
  DefinitionRecord, InstanceRecord, ComponentRecord,
  Provider, Type, ForwardRef,
  InjectorOptions, InjectorScopeType, ModuleMetadata, ModuleID, ExportedModule, PlainProvider,
} from "../interfaces";
import { INJECTOR_SCOPE, MODULE_INITIALIZERS, COMMON_HOOKS, ANNOTATIONS } from "../constants";
import { InjectionStatus, SessionStatus } from "../enums";
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

export class Injector {
  static create = createInjector;

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

  /**
   * Flag indicating that this injector was previously initialized.
   */
  get initialized(): boolean {
    return this._initialized;
  }
  private _initialized: boolean = false;

  /**
   * Flag indicating that this injector was previously destroyed.
   */
  get destroyed(): boolean {
    return this._destroyed;
  }
  private _destroyed = false;

  constructor(
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

  compile(): Injector {
    if (Array.isArray(this.injector)) return;
    Compiler.compile(this.injector, this);
    return this;
  }

  async compileAsync(): Promise<Injector> {
    if (Array.isArray(this.injector)) return;
    await Compiler.compileAsync(this.injector, this);
    return this;
  }

  selectChild(mod: Type, id: ModuleID = 'static'): Injector | undefined {
    let founded = this.imports.get(mod);
    if (founded instanceof Map) {
      return founded.get(id);
    }
    return founded.id === id ? founded : undefined;
  }

  private async initModule(): Promise<void> {
    // resolve INJECTOR_SCOPE provider again - it can be changed in provider array
    this.configureScope();

    const initializers = (await this.get(MODULE_INITIALIZERS, COMMON_HOOKS.OptionalSelf)) || [];
    let initializer = undefined;
    for (let i = 0, l = initializers.length; i < l; i++) {
      initializer = await initializers[i];
      if (typeof initializer === "function") {
        await initializer();
      }
    }

    // at the end init given module
    typeof this.injector === 'function' && this.getComponent(this.injector as any);
    this._initialized = true;
  }

  init() {
    if (this._initialized === true) return; 
    this._initialized = true;

    // try {
    //   // Call all the lifecycle hooks.
    //   this.onDestroy.forEach(service => service.ngOnDestroy());
    // } finally {
    //   // Release all references.
    //   this.records.clear();
    //   this.onDestroy.clear();
    //   this.injectorDefTypes.clear();
    // }
  }

  destroy() {
    if (this._destroyed === true) return; 
    this._destroyed = true;


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
    session.setAsync(true);
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
      // Remove assigned record from session 
      session.setRecord(undefined);
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
    if (session.status & SessionStatus.DRY_RUN) {
      return;
    }

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

    // parallel or circular injection
    if (instance.status > InjectionStatus.UNKNOWN) {
      return InjectorResolver.handleParallelInjection(instance, session) as T;
    }

    instance.status |= InjectionStatus.PENDING;
    return thenable(
      () => def.factory(record.host, session) as T,
      value => {
        if (instance.status & InjectionStatus.CIRCULAR) {
          value = Object.assign(instance.value, value);
        }
        instance.value = value;

        handleOnInit(instance, session);

        instance.status |= InjectionStatus.RESOLVED;
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
    InjectorMetadata.toRecord(provider, this);
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
  processExports(exps: Array<
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
    if ((exp as ExportedModule).module) {
      const { module, id, providers } = (exp as ExportedModule);
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
