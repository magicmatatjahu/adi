import { getModuleDef, getProviderDef } from "../definitions";
import { InjectionStatus, ModuleType, ProviderDefFlags, ProviderType, RESOLUTION_CHECK, ScopeFlags } from "../enums";
import { Type, Provider, ModuleMeta, InjectionRecord, ContextRecord, InjectorRecord, InjectionSession, InjectionOptions, DynamicModule, ForwardRef, ProviderDef, RecordDefinition } from "../interfaces";
import { Context, InjectionToken } from "../tokens";
import { assign, hasOnInitHook, resolveForwardRef } from "../utils";
import { MODULE, SHARED_MODULE, INLINE_MODULE, EMPTY_OBJ, EMPTY_ARR } from "../constants";
import { INJECTOR_SCOPE, MODULE_INITIALIZERS } from "../providers";
import { Scope } from "../scopes";
import { Token } from "../types";

import { createInjector } from "./factories";
import { Injector } from "./injector";
import { resolver, CIRCULAR_DATA } from "./resolver";
import { metadata } from "./metadata";

const injectorRegistry = new Map<Type, InjectorImpl>();

export class InjectorImpl implements Injector {
  readonly imports = new Map<Type, InjectorRecord<Type, InjectorImpl>>();
  readonly components = new Map<Type, InjectionRecord>();
  readonly ownRecords = new Map<Token, InjectionRecord>();
  readonly importedRecords = new Map<Token, InjectionRecord>();
  private readonly inlineModules: Array<Type> = [];
  private injectorScope: Array<string | symbol | Type>;

  constructor(
    private readonly injector: Type<any> | ModuleMeta,
    private readonly parentInjector?: Injector,
    setupProviders?: Array<Provider>,
  ) {
    if (typeof injector !== "function") {
      this.addProviders(injector.providers);
    } else {
      this.components.set(MODULE as any, metadata.typeProviderToRecord(injector, this));
    }

    if (setupProviders) {
      this.addProviders(setupProviders);
    }
    this.configureScope();
  }

  resolveSync<T>(token: Token<T>, options?: InjectionOptions, session?: InjectionSession): T | undefined  {
    return this.resolve(token, options, session, true) as T | undefined;
  }

  resolve<T>(token: Token<T>, options?: InjectionOptions, session?: InjectionSession, sync?: boolean): Promise<T | undefined> | T | undefined {
    options = options || EMPTY_OBJ;
    let flags = options.flags;
    // RESOLUTION_CHECK is a group of Self, SkipSelf, NoInject and SpecialToken flags -> they're a rare cases so they're handled in else condition (for optimization)
    const resolutionCheck = flags & RESOLUTION_CHECK;
    const record = resolutionCheck ? undefined : this.retrieveRecord(token);
    if (record !== undefined) {
      try {
        const def = this.findDefinition(record, options, session);
        return this.resolveDef(def, record, options, session, sync);
      } catch(err) {
        // TODO: improve error
        throw err;
      }
      // let scope = def.scope;
      // if (scope.flags & ScopeFlags.CAN_OVERRIDE) {
      //   scope = options.scope || scope;
      // }

      // try {
      //   const contextRecord = metadata.getContextRecord(def, options, scope, session);
      //   return this.resolveProvider(record, def, contextRecord, options, scope, session, sync);
      // } catch (err) {
      //   // TODO: improve error
      //   throw err;
      // }
    } else {
      // check RESOLUTION_CHECK to avoid unnecessary operations
      if (resolutionCheck > 0) {
        return resolver.handleResolutionCheck(this, token, options, session, sync);
      } else {
        return this.parentInjector.resolve(token, options, session, sync); 
      }
    }
  }

  resolveDef<T>(
    def: RecordDefinition<T>,
    record: InjectionRecord<T>,
    options: InjectionOptions, 
    session?: InjectionSession, 
    sync?: boolean,
  ): Promise<T | undefined> | T | undefined {
    let scope = def.scope;
    if (scope.flags & ScopeFlags.CAN_OVERRIDE) {
      scope = options.scope || scope;
    }
    const contextRecord = metadata.getContextRecord(def, options, scope, session);
    return this.resolveProvider(record, def, contextRecord, options, session, sync);
  }

  async resolveComponent<T>(component: Type<T>): Promise<T | never> {
    const record = this.components.get(component);
    const def = record.defaultDef;
    if (!record) {
      throw new Error(`No given component ${component}`);
    }

    const ctxRecord = metadata.getContextRecord(def, EMPTY_OBJ, def.scope);
    const value = ctxRecord.value = await def.factory(record.hostInjector, { 
      ctxRecord,
      options: undefined,
      parent: undefined,
    });

    if (hasOnInitHook(value, ProviderType.CLASS)) {
      await value.onInit();
    }
    return value;
  }

  resolveComponentSync<T>(component: Type<T>): T | never {
    const record = this.components.get(component);
    const def = record.defaultDef;
    if (!record) {
      throw new Error(`No given component ${component}`);
    }

    const ctxRecord = metadata.getContextRecord(def, EMPTY_OBJ, def.scope);
    const value = ctxRecord.value = def.factory(record.hostInjector, { 
      ctxRecord,
      options: undefined,
      parent: undefined,
    });

    if (hasOnInitHook(value, ProviderType.CLASS)) {
      value.onInit();
    }
    return value;
  }

  getParentInjector(): Injector | null {
    return this.parentInjector || null;
  }

  async compile(): Promise<void> {
    if (typeof this.injector === "function") {
      await this.processModule(this.injector, []);
    }
  }

  private resolveProvider<T>(
    record: InjectionRecord<T>,
    def: RecordDefinition<T>,
    ctxRecord: ContextRecord<T>,
    options: InjectionOptions,
    session?: InjectionSession,
    sync?: boolean,
  ): Promise<T> | T {
    if (ctxRecord.status & InjectionStatus.RESOLVED) {
      return ctxRecord.value;
    }

    if (ctxRecord.status & InjectionStatus.UNKNOWN) {
      // Remove UNKNOWN bit and add PENDING bit
      ctxRecord.status &= ~InjectionStatus.UNKNOWN;
      ctxRecord.status |= InjectionStatus.PENDING;

      if (sync === true) {
        return this.resolveProviderSync(record, def, ctxRecord, options, session);
      } else {
        return this.resolveProviderAsync(record, def, ctxRecord, options, session);
      }
    }

    return resolver.handleCircularDeps(ctxRecord);
  }

  private async resolveProviderAsync<T>(
    record: InjectionRecord<T>,
    def: RecordDefinition<T>,
    ctxRecord: ContextRecord<T>,
    options: InjectionOptions,
    session?: InjectionSession,
  ): Promise<T> {
    const value = await def.factory(record.hostInjector, { 
      ctxRecord,
      options,
      parent: session,
    }, false);

    if (ctxRecord.status & InjectionStatus.CIRCULAR) {
      assign(ctxRecord.value, value);
      CIRCULAR_DATA.ctx.delete(ctxRecord);
      if (!CIRCULAR_DATA.ctx.size) {
        CIRCULAR_DATA.is = false;
        await resolver.handleCircularOnInit();
      }
    } else {
      ctxRecord.value = value;
    }

    if (CIRCULAR_DATA.is) {
      CIRCULAR_DATA.onInit.add(ctxRecord);
    } else {
      // TODO: think how to handle in different way onInit - it also fires on factory providers etc 
      hasOnInitHook(value, def.type) && await value.onInit();
    }

    ctxRecord.status = InjectionStatus.RESOLVED;
    return ctxRecord.value;
  }

  private resolveProviderSync<T>(
    record: InjectionRecord<T>,
    def: RecordDefinition<T>,
    ctxRecord: ContextRecord<T>,
    options: InjectionOptions,
    session?: InjectionSession,
  ): T {
    const newSession: InjectionSession = { 
      ctxRecord,
      options,
      parent: session,
    };
    const value = def.factory(record.hostInjector, newSession, true) as T;

    if (ctxRecord.status & InjectionStatus.CIRCULAR) {
      assign(ctxRecord.value, value);
      CIRCULAR_DATA.ctx.delete(ctxRecord);
      if (!CIRCULAR_DATA.ctx.size) {
        CIRCULAR_DATA.is = false;
        resolver.handleCircularOnInitSync();
      }
    } else {
      ctxRecord.value = value;
    }

    if (CIRCULAR_DATA.is) {
      CIRCULAR_DATA.onInit.add(ctxRecord);
    } else {
      // TODO: think how to handle in different way onInit - it also fires on factory providers etc 
      hasOnInitHook(value, def.type) && value.onInit();
    }

    ctxRecord.status = InjectionStatus.RESOLVED;
    return ctxRecord.value;
  }

  retrieveRecord<T>(
    token: Token<T>,
  ): InjectionRecord {
    let record = this.getRecord(token);

    // providedIn case
    if (record === undefined) {
      const def = getProviderDef(token);
      if (this.isProviderDefInScope(def)) {
        if (typeof token === "function") {
          record = metadata.typeProviderToRecord(token as Type<T>, this);
        } else {
          record = metadata.customProviderToRecord(token, def as any, this);
        }

        if (def.flags & ProviderDefFlags.EXPORT) {
          const injectoRecord = this.imports.get(def.providedIn as Type);
          if (injectoRecord) {
            // case when module is imported
            injectoRecord.values.forEach(v => {
              v.injector.ownRecords.set(token, record);
            })
            this.importedRecords.set(token, record);
          } else {
            // other cases like def.providedIn == this.injector or typeof def.providedIn === "number"
            this.ownRecords.set(token, record);
          }
        } else {
          this.ownRecords.set(token, record);
        }
      }
    }

    return record;
  }

  findDefinition(
    record: InjectionRecord,
    options: InjectionOptions,
    session?: InjectionSession
  ): RecordDefinition {
    const defs = record.defs;
    if (defs.length === 0 || record.isMulti) {
      return record.defaultDef;
    }

    for (let i = defs.length - 1; i > -1; i--) {
      const d = defs[i];
      if (d.constraint(options, session) === true) {
        return d;
      }
    }
    return record.defaultDef;
  }

  getRecord<T>(
    token: Token<T>,
  ): InjectionRecord {
    return this.ownRecords.get(token) || this.importedRecords.get(token);
  }

  addProviders(providers: Provider[]): void {
    for (let i = 0, l = providers.length; i < l; i++) {
      this.addProvider(providers[i]);
    }
  }

  addProvider<T>(
    provider: Provider<T>,
  ): void {
    metadata.toRecord(provider, this);
  }

  // private addFactoryProviders(type: Type) {
  //   const props = Object.getOwnPropertyNames(type);
  //   for (let i = 0, l = props.length; i < l; i++) {
  //     const method = type[props[i]], def = getProviderDef(method);
  //     if (def !== undefined) {
  //       const token = def.token as any;
  //       this.ownRecords.set(token, metadata.factoryToRecord(token, method, def, this));
  //     }
  //   }
  // }

  addComponents(components: Type[]): void {
    for (let i = 0, l = components.length; i < l; i++) {
      this.addComponent(components[i]);
    }
  }

  addComponent(component: Type): void {
    this.components.set(component, metadata.typeProviderToRecord(component, this));
  }

  import(): Injector {
    return undefined;
  }

  private addExports(_exports: Array<
    | Token
    | Provider
    | ForwardRef
  >, importer: InjectorImpl): void {
    for (let i = 0, l = _exports.length; i < l; i++) {
      this.addExport(_exports[i], importer);
    }
  }

  private addExport(
    exp: Token | Provider | ForwardRef,
    importer: InjectorImpl,
  ): void {
    exp = resolveForwardRef(exp);
    if (typeof exp === "function") {
      // type provider case and module case
      const moduleDef = getModuleDef(exp);
      if (moduleDef === undefined) {
        // TODO: Maybe this.ownRecords -> think about exporting imports...
        const record = this.getRecord(exp);
        if (record) {
          importer.importedRecords.set(exp, record);
        }
      } else {
        this.addExports(moduleDef.exports || [], importer);
      }
    } else {
      // custom provider case and inline token like string, symbol or InjectionToken
      const token: any = (exp as any).provide || exp;
      const record = this.getRecord(token);
      if (record) {
        importer.importedRecords.set(token, record);
      }
    }
  }

  private async processModule<T>(_module: Type<T> | DynamicModule<T> | Promise<DynamicModule> | ForwardRef<T>, modulesStack: Array<InjectorImpl>, importer?: InjectorImpl) {
    _module = resolveForwardRef(_module);
    if (!_module) {
      return;
    }

    let moduleDef = getModuleDef(_module), 
      dynamicModuleDef: DynamicModule<T> = undefined, 
      dynamicModuleExists = false;
    if (moduleDef === undefined) {
      dynamicModuleDef = await (_module as Promise<DynamicModule>);
      _module = dynamicModuleDef.module;
      dynamicModuleExists = true;
      moduleDef = getModuleDef(_module);
    }
    const mod = _module as Type;

    if (moduleDef === undefined) {
      throw new Error("ModuleDef is undefined");
    }

    // indicate if own metadata from definition is processed
    let processOwnMetadata = true;

    let hostInjector: InjectorImpl = this;
    const moduleType = (dynamicModuleDef || moduleDef).type || ModuleType.SHARED;
    if (importer) {
      let injectorRecord = importer.imports.get(mod);
      if (!injectorRecord) {
        injectorRecord = metadata.makeInjectorRecord(mod);
        importer.imports.set(mod, injectorRecord);
      }

      if (moduleType === ModuleType.SHARED) {
        let contextRecord = injectorRecord.values.get(SHARED_MODULE);
        processOwnMetadata = false;
        if (contextRecord === undefined) {
          const injector = injectorRegistry.get(mod) || 
            injectorRegistry.set(mod, createInjector(mod) as InjectorImpl).get(mod);
          contextRecord = metadata.makeInjectorContextRecord(injector, SHARED_MODULE, ModuleType.SHARED);
          injectorRecord.values.set(SHARED_MODULE, contextRecord);
          modulesStack.push(injector);
          processOwnMetadata = true;
        }
        hostInjector = contextRecord.injector;
      } else if (moduleType === ModuleType.DOMAIN) {
        hostInjector = createInjector(mod, importer) as InjectorImpl;
        modulesStack.push(hostInjector);
        const ctx = new Context();
        const contextRecord = metadata.makeInjectorContextRecord(hostInjector, ctx, ModuleType.DOMAIN);
        injectorRecord.values.set(ctx, contextRecord);
      } else {
        // INLINE case
        hostInjector = importer;
        processOwnMetadata = false;
        if (injectorRecord.values.get(INLINE_MODULE) === undefined) {
          const contextRecord = metadata.makeInjectorContextRecord(hostInjector, INLINE_MODULE, ModuleType.INLINE);
          injectorRecord.values.set(INLINE_MODULE, contextRecord);
          processOwnMetadata = true;

          // save module as component
          hostInjector.components.set(mod, metadata.typeProviderToRecord(mod, hostInjector));
          hostInjector.inlineModules.push(mod);
        }
      }
    }

    if (processOwnMetadata) {
      const imports = moduleDef.imports || EMPTY_ARR;
      for (let i = 0, l = imports.length; i < l; i++) {
        await hostInjector.processModule(imports[i], modulesStack, hostInjector);
      }
    }

    if (dynamicModuleExists) {
      const imports = dynamicModuleDef.imports || EMPTY_ARR; 
      for (let i = 0, l = imports.length; i < l; i++) {
        await hostInjector.processModule(imports[i], modulesStack, hostInjector);
      }  
    }

    if (processOwnMetadata) {
      hostInjector.addProviders(moduleDef.providers || EMPTY_ARR);
      hostInjector.addComponents(moduleDef.components || EMPTY_ARR);
      hostInjector.addExports(moduleDef.exports || EMPTY_ARR, importer);
    }

    if (dynamicModuleExists) {
      hostInjector.addProviders(dynamicModuleDef.providers || EMPTY_ARR);
      hostInjector.addComponents(dynamicModuleDef.components || EMPTY_ARR);
      hostInjector.addExports(dynamicModuleDef.exports || EMPTY_ARR, importer);
    }

    // resolve modules as component
    if (!importer) {
      for (let i = modulesStack.length - 1; i > -1; i--) {
        await modulesStack[i].initModule();
      }
      // root module
      await this.initModule();
    }
  }

  async initModule(): Promise<void> {
    // resolve INJECTOR_SCOPE provider
    this.configureScope();
    // first init all providers for MODULE_INITIALIZERS multi token
    // and if returned value (one of returned) is a function, call this function
    const initializers = await this.resolve(MODULE_INITIALIZERS);
    let initializer = undefined;
    for (let i = 0, l = initializers.length; i < l; i++) {
      if (typeof (initializer = initializers[i]) === "function") {
        await initializer();
      }
    }
    // then init all inlined modules for given module
    for (let i = 0, l = this.inlineModules.length; i < l; i++) {
      await this.resolveComponent(this.inlineModules[i]);
    }
    // at the end init given module
    await this.resolveComponent(MODULE as any);
  }

  private isProviderDefInScope(def: ProviderDef): boolean {
    if (def === undefined || def.providedIn === undefined) {
      return false;
    } else if (this.injectorScope.includes(def.providedIn)) {
      return true;
    } else if (def.flags & ProviderDefFlags.EXPORT) {
      // case with providedIn: SomeModule and export: true
      return this.imports.has(def.providedIn as Type);
    }
    // case with inlined module
    const record = this.imports.get(def.providedIn as Type);
    const inlineModule = record && record.values.get(INLINE_MODULE);
    return inlineModule && inlineModule.injector === this;
  }

  private configureScope(): void {
    this.injectorScope = ["any", this.injector as any];
    const scopes = this.resolveSync(INJECTOR_SCOPE);
    if (Array.isArray(scopes)) {
      for (let i = 0, l = scopes.length; i < l; i++) {
        this.injectorScope.push(scopes[i]);
      }  
    } else {
      this.injectorScope.push(scopes);
    }
  }
}
