import { getProviderDef } from "../decorators";
import { 
  InjectionOptions, InjectionSession,
  ProviderRecord, WrapperRecord, DefinitionRecord, InstanceRecord, 
  Provider, ProviderDef, WrapperDef, NextWrapper, Type,
  ModuleMetadata,
} from "../interfaces";
import { InjectionStatus, ScopeFlags } from "../enums";
import { Token } from "../types";

import { InjectorMetadata } from "./metadata";

export class Injector {
  // own records
  private readonly records = new Map<Token, ProviderRecord>();
  // records from imported modules
  private readonly importedRecords = new Map<Token, ProviderRecord>();
  // scopes of injector
  private scopes: Array<string | symbol | Type> = ['any'];

  constructor(
    private readonly injector: Type<any> | ModuleMetadata | Array<Provider>,
    private readonly parent: Injector = NilInjector,
    private readonly setupProviders?: Array<Provider>,
  ) {
    if (typeof injector !== "function") {
      this.addProviders(Array.isArray(injector) ? injector : injector.providers);
    }
    // this.addProviders(this.injector);
    typeof injector === 'function' && this.scopes.push(injector);
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

  private addProviders(providers: Provider[]): void {
    for (let i = 0, l = providers.length; i < l; i++) {
      InjectorMetadata.toRecord(providers[i], this);
    }
  }

  // add case with modules, inline modules etc.
  private isProviderInScope(def: ProviderDef): boolean {
    if (def === undefined || def.providedIn === undefined) {
      return false;
    }
    if (this.scopes.includes(def.providedIn)) return true;
  }
}

export const NilInjector = new class {
  get(token: Token): never {
    const error = new Error(`NilInjector: No provider for ${token as any}!`);
    error.name = 'NilInjectorError';
    throw error;
  }

  getParentInjector() {
    return null;
  }
} as unknown as Injector;

export function createInjector(
  injector: Type<any> | ModuleMetadata | Array<Provider> = [],
  parent: Injector = NilInjector,
  setupProviders?: Array<Provider>,
): Injector {
  injector = Array.isArray(injector) ? { providers: injector } : injector;
  return new Injector(injector, parent, setupProviders);
}
