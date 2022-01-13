import { getModuleDef } from "../decorators";
import { 
  DefinitionRecord,
  Provider, Type,
  InjectorOptions, InjectorScopeType, PlainProvider,
  ModuleMetadata, ModuleID, ExportItem, ExportedModule, WrapperRecord, ScopeShape
} from "../interfaces";
import { MODULE_INITIALIZERS, ANNOTATIONS, INJECTOR_OPTIONS, EMPTY_OBJECT, MODULE_REF, EMPTY_ARRAY } from "../constants";
import { InjectorStatus, InstanceStatus, SessionStatus } from "../enums";
import { Token } from "../types";
import { resolveRef, handleOnInit, thenable, compareOrder } from "../utils";
import { 
  runRecordsWrappers,
  runWrappers, Wrapper,
} from "../utils/wrappers";

import { ProviderRecord } from "./provider";
import { Session } from "./session";
import { All } from "../wrappers";
import { CoreHook } from "../wrappers/internal";
import { NilInjectorError } from "../errors";

import { build, buildAsync } from "./module-compiler";
import { getProviderDef, toRecord, typeProviderToRecord, customProviderToRecord } from "./metadata";
import { handleParallelInjection } from "./resolver";
import { destroyRecords, destroyRecord, destroyDefinition } from "./destroy-manager";

export class Injector {
  static create(
    metatype: Type<any> | ModuleMetadata | Array<Provider> = [],
    parent: Injector = NilInjector,
    options?: InjectorOptions,
  ): Injector {
    return new Injector(metatype, parent, options);
  }

  /**
   * MAKE IT READONLY PRIVATE!
   */
  // imported modules
  imports = new Map<Type, Map<ModuleID, Injector>>();
  // own records
  records = new Map<Token, ProviderRecord>();
  // records from imported modules
  importedRecords = new Map<Token, Array<ProviderRecord>>();
  // scopes of injector
  scopes: Array<InjectorScopeType>;
  // id of injector/module
  id: ModuleID = 'static';
  // status of injector
  status: InjectorStatus = InjectorStatus.NONE;

  constructor(
    readonly metatype: Type<any> | ModuleMetadata | Array<Provider> = [],
    readonly parent: Injector = NilInjector,
    public options: InjectorOptions = {},
  ) {
    this.scopes = ['any', this.metatype as any];

    const providers: Provider[] = [];
    if (typeof metatype === 'function') {
      providers.push({ provide: MODULE_REF, useExisting: metatype }, metatype);
    } else if (Array.isArray(metatype)) {
      providers.push({ provide: MODULE_REF, useValue: metatype }, ...metatype);
    } else {
      providers.push({ provide: MODULE_REF, useValue: metatype });
    }
    if (options !== undefined) {
      this.addProviders(options.setupProviders);
    }

    providers.push(
      { provide: Injector, useValue: this },
      { provide: MODULE_INITIALIZERS, useWrapper: All({ inheritance: 'onlySelf' }) }
    );
    this.addProviders(providers);
    loadOptions(this);
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
    return Injector.create(injector, this, options);
  }

  getChild(mod: Type, id: ModuleID = 'static'): Injector | undefined {
    let founded = this.imports.get(mod);
    if (founded === undefined) {
      return;
    }
    return founded.get(id);
  }

  build(): Injector {
    if (this.status & InjectorStatus.BUILDED) return; 
    this.status |= InjectorStatus.BUILDED;

    if (Array.isArray(this.metatype)) return;
    build(this);
    return this;
  }

  async buildAsync(): Promise<Injector> {
    if (this.status & InjectorStatus.BUILDED) return; 
    this.status |= InjectorStatus.BUILDED;

    if (Array.isArray(this.metatype)) return;
    await buildAsync(this);
    return this;
  }

  async destroy() {
    if (this.status & InjectorStatus.DESTROYED) return; 
    this.status |= InjectorStatus.DESTROYED;

    // destroy and clear own records
    try {
      await this.clear();
    } finally {
      // only clear imported values
      this.importedRecords.clear();
    }

    // remove injector from parent imports
    if (this.parent !== NilInjector) {
      const importInParent = this.parent.imports.get(this.metatype as any);
      importInParent && importInParent.delete(this.id);
    }

    // then destroy and clean all imported modules
    try {
      const imports = Array.from(this.imports.values());
      for (let i = 0, li = imports.length; i < li; i++) {
        const modules = Array.from(imports[i].values());
        for (let j = 0, lm = modules.length; j < lm; j++) {
          await modules[j].destroy();
        }
      }
    } finally {
      this.imports.clear();
    }
  }

  /**
   * PROVIDERS
   */
  // TODO: Add support for shared object as third argument (union with Session)
  get<T>(token: Token<T>, wrapper?: Wrapper | Array<Wrapper>, session?: Session): T | undefined {
    if (wrapper) {
      wrapper = Array.isArray(wrapper) ? [CoreHook(), ...wrapper] : [CoreHook(), wrapper];
    } else {
      wrapper = CoreHook();
    }
    return this.resolveToken(wrapper, session || Session.createStandalone(token, this));
  }

  async getAsync<T>(token: Token<T>, wrapper?: Wrapper | Array<Wrapper>, session?: Session): Promise<T | undefined> {
    if (wrapper) {
      wrapper = Array.isArray(wrapper) ? [CoreHook(), ...wrapper] : [CoreHook(), wrapper];
    } else {
      wrapper = CoreHook();
    }
    session = session || Session.createStandalone(token, this);
    session.status |= SessionStatus.ASYNC;
    return this.resolveToken(wrapper, session);
  }

  resolveToken<T>(wrapper: Wrapper | Array<Wrapper>, session: Session): T | undefined {
    session.injector = this;
    if (wrapper) {
      return runWrappers(wrapper, session, lastInjectionWrapper);
    }
    return this.resolveRecord(session);
  }

  resolveRecord<T>(session: Session): T | undefined {
    let record = filterRecords(this, session.getToken());
    if (record === undefined) {
      // Reuse session in the parent
      return this.parent.resolveRecord(session);
    }

    if (Array.isArray(record)) {
      const wrappers = getRecordsWrappers(record, session);
      if (wrappers.length > 0) {
        return runRecordsWrappers(wrappers, session, (s: Session) => s.injector.getDefinition(s, record as Array<ProviderRecord>));
      }
      return this.getDefinition(session, record);
    }

    session.injector = record.host;
    session.record = record;
    const wrappers = record.filterWrappers(session);
    if (wrappers.length > 0) {
      return runWrappers(wrappers, session, lastProviderWrapper);
    }
    return this.getDefinition(session);
  }

  getDefinition<T>(session: Session, records?: Array<ProviderRecord>): T | undefined {
    if (session.definition) {
      const def = session.definition;
      session.record = def.record;
      session.injector = def.record.host;
  
      if (def.wrapper !== undefined) {
        return runWrappers(def.wrapper, session, lastDefinitionWrapper);
      }
      return this.resolveDefinition(def, session);
    }

    let def: DefinitionRecord;
    if (Array.isArray(records)) {
      for (let i = records.length - 1; i > -1; i--) {
        const record = session.record = records[i];
        session.injector = record.host;
        const constraintDefs = record.constraintDefs;

        if (constraintDefs.length === 0) {
          def = def || record.defs[record.defs.length - 1];
        }

        for (let i = constraintDefs.length - 1; i > -1; i--) {
          const constraintDef = constraintDefs[i];
          if (constraintDef.constraint(session) === true) {
            def = constraintDef;
            break;
          }
        }
      }
    } else {
      def = session.record.getDefinition(session);
    }

    if (def === undefined) {
      // Remove assigned record from session 
      session.record = undefined;
      // Reuse session in the parent
      return this.parent.resolveRecord(session);
    }
    session.injector = def.record.host;
    session.record = def.record;
    session.definition = def;

    // check dry run
    if (session.status & SessionStatus.DRY_RUN) {
      return;
    }

    if (def.wrapper) {
      return runWrappers(def.wrapper, session, lastDefinitionWrapper);
    }
    return this.resolveDefinition(def, session);
  }

  resolveDefinition<T>(def: DefinitionRecord<T>, session: Session): T | undefined {
    let scope = def.scope;
    if (scope.kind.canBeOverrided()) {
      scope = session.getScope() || scope;
    }

    session.instance = def.record.getInstance(def, scope, session);
    return this.resolveInstance(session, scope);
  }

  resolveInstance<T>(
    session: Session,
    scope: ScopeShape,
  ): T {
    const instance = session.instance;
    if (instance.status & InstanceStatus.RESOLVED) {
      return instance.value;
    }

    // parallel or circular injection
    if (instance.status > InstanceStatus.UNKNOWN) {
      return handleParallelInjection(instance, session) as T;
    }

    instance.status |= InstanceStatus.PENDING;
    return thenable(
      () => scope.kind.create(session, scope.options),
      value => {
        if (instance.status & InstanceStatus.CIRCULAR) {
          value = Object.assign(instance.value, value);
        }
        instance.value = value;
        return thenable(
          () => handleOnInit(instance, session),
          () => {
            instance.status |= InstanceStatus.RESOLVED;
            return instance.value;
          }
        );
      }
    ) as unknown as T;
  }

  getRecord<T>(
    token: Token<T>,
  ): ProviderRecord {
    let record = this.records.get(token) || this.getImportedRecord(token);

    // check for treeshakable provider - `providedIn` case
    if (record === undefined) {
      record = checkTreeshakable(this, token);
    }

    return record;
  }

  addProviders(providers: Provider | Provider[], isComponent: boolean = false): void {
    if (this.status & InjectorStatus.DESTROYED) return;

    if (Array.isArray(providers)) {
      for (let i = 0, l = providers.length; i < l; i++) {
        providers[i] && toRecord(providers[i], this, isComponent);
      }
      return;
    }
    providers && toRecord(providers, this, isComponent);
  }

  remove(token: Token, defName?: string | symbol) {
    const record = this.records.get(token);
    if (!record) {
      return;
    }

    if (defName) {
      const definitions = [...record.defs, ...record.constraintDefs];
      const def = definitions.find(def => def.name === defName);
      return def ? destroyDefinition(def) : undefined;
    }
    return destroyRecord(record);
  }

  clear() {
    const records = Array.from(this.records.values());
    this.records.clear();
    return destroyRecords(records);
  }

  /**
   * MISC
   */
  // invoke<T>(fun: (...args: any[]) => T, injections: Array<InjectionItem>) {
  //   const deps = InjectorMetadata.convertDependencies(injections, InjectionKind.FUNCTION, fun);
  //   const session = Session.create(undefined, { target: fun, kind: InjectionKind.STANDALONE });
  //   return fun(...InjectorResolver.injectDeps(deps, this, session));
  // }

  // async invokeAsync<T>(fun: (...args: any[]) => Promise<T>, injections: Array<InjectionItem>): Promise<T> {
  //   const deps = InjectorMetadata.convertDependencies(injections, InjectionKind.FUNCTION, fun);
  //   const session = Session.create(undefined, { target: fun, kind: InjectionKind.STANDALONE });
  //   return InjectorResolver.injectDepsAsync(deps, this, session).then(args => fun(...args));
  // }

  /**
   * EXPORTS
   */
  export(exps: Array<ExportItem> = [], to: Injector): void {
    if (
      this.options.disableExporting ||
      this.status & InjectorStatus.DESTROYED || 
      to === NilInjector
    ) return;

    for (let i = 0, l = exps.length; i < l; i++) {
      processExport(exps[i], this, to);
    }
  }

  private getImportedRecord(token: Token) {
    const collection = this.importedRecords.get(token);
    // get last item in the collection
    return collection && collection[collection.length - 1];
  }
}

function filterRecords(injector: Injector, token: Token): ProviderRecord | Array<ProviderRecord> | undefined {
  const record = injector.records.get(token) || checkTreeshakable(injector, token);
  let importedRecords = injector.importedRecords.get(token);
  if (importedRecords) {
    importedRecords = [...importedRecords];
    record && importedRecords.push(record);
    return importedRecords;
  }
  return record;
}

function getRecordsWrappers(records: Array<ProviderRecord>, session: Session): Array<{ record: ProviderRecord, wrapper: Wrapper }> {
  const wrappers: Array<{ record: ProviderRecord, wrapper: Wrapper, annotations: Record<string, any> }> = [];
  for (let i = records.length - 1; i > -1; i--) {
    const record = records[i];
    const filteredWrappers = filterRecordWrappers(record, session);
    for (let j = filteredWrappers.length - 1; j > -1; j--) {
      const { wrapper, annotations } = filteredWrappers[j];
      if (Array.isArray(wrapper)) {
        for (let k = 0, l = wrapper.length; k < l; k++) {
          wrappers.push({ record, wrapper: wrapper[k], annotations });
        }
      } else {
        wrappers.push({ record, wrapper, annotations });
      }
    }
  }
  return wrappers.sort(compareOrder);
}

function filterRecordWrappers(
  record: ProviderRecord,
  session: Session
): Array<WrapperRecord> {
  if (record.wrappers.length === 0) return EMPTY_ARRAY;
  session.injector = record.host;
  const wrappers = record.wrappers, satisfyingWraps: WrapperRecord[] = [];
  for (let i = 0, l = wrappers.length; i < l; i++) {
    const wrapper = wrappers[i];
    if (wrapper.constraint(session) === true) {
      satisfyingWraps.push(wrapper);
    }
  }
  return satisfyingWraps;
}

function lastInjectionWrapper(session: Session) {
  return session.injector.resolveRecord(session);
}

function lastProviderWrapper(session: Session) {
  return session.injector.getDefinition(session);
}

function lastDefinitionWrapper(session: Session) {
  return session.injector.resolveDefinition(session.definition, session);
}

function checkTreeshakable(injector: Injector, token: Token): ProviderRecord {
  const def = getProviderDef(token, false);
  const provideIn = def?.options?.provideIn;
  if (provideIn === undefined) {
    return;
  }

  let record: ProviderRecord;
  if (isProviderInScope(injector.scopes, provideIn)) {
    if (typeof token === "function") { // type provider case
      record = typeProviderToRecord(token as Type, injector);
    } else { // injection token case
      record = customProviderToRecord(token, def as any, injector);
    }
  } else { // imports case
    const annotations = def?.options?.annotations || EMPTY_OBJECT;
    if (annotations[ANNOTATIONS.EXPORT] !== true) {
      return;
    }

    injector.imports.forEach(imp => imp.forEach(inj => {
      if (isProviderInScope(inj.scopes, provideIn) === false) return;

      if (typeof token === "function") { // type provider case
        record = typeProviderToRecord(token as Type, inj);
      } else { // injection token case
        record = customProviderToRecord(token, def as any, inj);
      }
      setImportedRecords(injector, token, record);
    }));
  }
  return record;
}

function isProviderInScope(scopes: InjectorScopeType[], provideIn?: InjectorScopeType | InjectorScopeType[]): boolean {
  if (Array.isArray(provideIn)) {
    return provideIn.some(scope => scopes.includes(scope));
  }
  return scopes.includes(provideIn);
}

function setImportedRecords(injector: Injector, token: Token, record: ProviderRecord) {
  let collection = injector.importedRecords.get(token);
  if (collection === undefined) {
    collection = [];
    injector.importedRecords.set(token, collection);
  }
  collection.push(record);
}

function processExport(exp: ExportItem, from: Injector, to: Injector): void {
  exp = resolveRef(exp);

  if (typeof exp === "function") {
     // export can be module definition
    const moduleDef = getModuleDef(exp);
    if (moduleDef !== undefined) {
      processModuleExport(exp as Type, 'static', from, to);
      return;
    }

    // type provider
    const record = from.records.get(exp);
    if (record !== undefined) {
      setImportedRecords(to, exp, record);
    } else { // create new provider in the parent injector
      to.addProviders(exp as any);
    }
  }

  // operate on DynamicModule
  if ((exp as ExportedModule).module) {
    const { module, id, providers } = (exp as ExportedModule);
    processModuleExport(module, id || 'static', from, to, providers);
    return;
  }

  // create new provider in the parent injector
  if ((exp as PlainProvider).provide) {
    to.addProviders(exp as PlainProvider);
    return;
  }

  // string, symbol or InjectionToken case
  const record = from.records.get(exp as Token);
  record && setImportedRecords(to, exp as Token, record);
}

function processModuleExport(mod: Type, id: ModuleID = 'static', from: Injector, to: Injector, providers?: Array<Provider | Token>) {
  if (from.imports.has(mod) === false) {
    throw Error(`cannot export from ${mod} module`);
  }

  const fromModule = from.imports.get(mod).get(id);
  if (fromModule === undefined) {
    throw Error(`cannot export from ${mod} module`);
  }

  if (providers === undefined) {
    from.importedRecords.forEach((collection, token) => {
      collection.forEach(record => {
        record.host === fromModule && setImportedRecords(to, token, record);
      });
    });
  } else {
    from.importedRecords.forEach((collection, token) => {
      collection.forEach(record => {
        record.host === fromModule && 
        providers.some(prov => prov === token || (prov as PlainProvider).provide === token) &&
        setImportedRecords(to, token, record);
      });
    });
  }
}

function loadOptions(injector: Injector): InjectorOptions {
  if (injector.records.has(INJECTOR_OPTIONS) === true) {
    const providerOptions = injector.get(INJECTOR_OPTIONS) || EMPTY_OBJECT as InjectorOptions;
    const previousDisablingExports = injector.options.disableExporting;
    injector.options = Object.assign(injector.options, providerOptions);
    injector.options.disableExporting = previousDisablingExports;
  }

  const { scope, id } = injector.options;
  injector.id = id || injector.id;
  scope && (injector.scopes = injector.scopes.concat(scope));
  return injector.options;
}

export function initInjector(injector: Injector, options?: { asyncMode: boolean }) {
  if (injector.status & InjectorStatus.INITIALIZED) return; 
  injector.status |= InjectorStatus.INITIALIZED;

  // resolve INJECTOR_OPTIONS provider again
  loadOptions(injector);

  const asyncMode = options?.asyncMode;
  return thenable(
    () => { // run MODULE_INITIALIZERS
      if (!injector.records.get(MODULE_INITIALIZERS)?.defs.length) return;
      if (asyncMode) return injector.getAsync(MODULE_INITIALIZERS);
      return injector.get(MODULE_INITIALIZERS);
    },
    () => { // initialize module
      if (asyncMode) return injector.getAsync(MODULE_REF)
      return injector.get(MODULE_REF);
    },
  );
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
