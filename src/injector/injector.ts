import { getProviderDef } from "../decorators";
import { 
  InjectionOptions, InjectionSession,
  ProviderRecord, WrapperRecord, DefinitionRecord, InstanceRecord, 
  Provider, ProviderDef, WrapperDef, NextWrapper, Type,
} from "../interfaces";
import { InjectionStatus, ScopeFlags } from "../enums";
import { Token } from "../types";

import { InjectorMetadata } from "./metadata";

export class Injector {
  // own records
  private readonly records = new Map<Token, ProviderRecord>();
  // records from imported modules
  private readonly importedRecords = new Map<Token, ProviderRecord>();

  constructor(
    private readonly providers: Array<Provider>,
    // private readonly injector: Type<any>, // | ModuleMeta
    private readonly parent: Injector = NilInjector,
    // setupProviders?: Array<Provider>,
  ) {
    this.addProviders(this.providers);
  }

  get<T>(token: Token<T>, options?: InjectionOptions, session?: InjectionSession): Promise<T | undefined> | T | undefined {
    const newSession = InjectorMetadata.createSession(undefined, options, session);

    const wrapper = options && options.wrapper;
    const nextFn = (nextWrapper: WrapperDef) => (injector: Injector, s: InjectionSession) => {
      const $$next = nextWrapper['$$next'];
      if ($$next !== undefined) {
        const next: NextWrapper = nextFn($$next);
        return nextWrapper(injector, s, next);
      }
      // fix passing options
      const next: NextWrapper = (i: Injector, s: InjectionSession) => i.retrieveRecord(token, s.options, s);
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
    if (options && scope.flags & ScopeFlags.CAN_OVERRIDE) {
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

      // const newSession = InjectorMetadata.createSession(instance, options, session);
      // const wrappers = this.getWrappers(record, newSession);
      // console.log(wrappers)
      // const value = def.factory(record.hostInjector, newSession) as T;

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
      if (this.isProviderDefInScope(def)) {
        if (typeof token === "function") {
          InjectorMetadata.typeProviderToRecord(token as Type, this);
        } else {
          InjectorMetadata.customProviderToRecord(token, def as any, this);
        }
      }
    }

    return record;
  }

  private getWrappers(
    record: ProviderRecord,
    session?: InjectionSession
  ): Array<WrapperRecord> {
    const wrappers = record.wrappers;
    const wraps = [];
    for (let i = 0, l = wrappers.length; i < l; i++) {
      const w = wrappers[i];
      if (w.constraint(session) === true) {
        wraps.push(w);
      }
    }
    return wraps;
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
  private isProviderDefInScope(def: ProviderDef): boolean {
    if (def === undefined || def.providedIn === undefined) {
      return false;
    }
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
