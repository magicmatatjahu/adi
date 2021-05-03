import { 
  InjectionOptions, InjectionSession,
  ProviderRecord, WrapperRecord, DefinitionRecord, InstanceRecord, 
  Provider,
  WrapperDef,
  FactoryDef,
  NextWrapper, 
} from "../interfaces";
import { InjectionStatus } from "../enums";
import { Token } from "../types";

import { InjectorMetadata } from "./metadata";

export class Injector {
  // own records
  private readonly records = new Map<Token, ProviderRecord>();
  // imported records
  private readonly importedRecords = new Map<Token, ProviderRecord>();

  constructor(
    private readonly providers: Array<Provider>,
    // private readonly injector: Type<any>, // | ModuleMeta
    private readonly parent?: Injector,
    // setupProviders?: Array<Provider>,
  ) {
    this.addProviders(this.providers);
  }

  get<T>(token: Token<T>, options?: InjectionOptions, session?: InjectionSession): Promise<T | undefined> | T | undefined {
    const record = this.getRecord(token);
    if (record !== undefined) {
      const def = this.getDefinition(record, session);

      let scope = def.scope;
      // if (scope.flags & ScopeFlags.CAN_OVERRIDE) {
      //   scope = options.scope || scope;
      // }
      const instance = InjectorMetadata.getInstanceRecord(def, scope, session);

      return this.resolve(record, def, instance, options, session);
    }
    return this.parent ? this.parent.get(token, options, session) : undefined;
  }

  private resolve<T>(
    record: ProviderRecord<T>,
    def: DefinitionRecord<T>,
    instance: InstanceRecord<T>,
    options?: InjectionOptions,
    session?: InjectionSession,
  ): Promise<T> | T {
    if (instance.status & InjectionStatus.RESOLVED) {
      return instance.value;
    }

    // InjectionStatus.UNKNOWN === 1
    if (instance.status === 1) {
      instance.status |= InjectionStatus.PENDING;

      const value = this.wrap(record, def, instance, options, session) as T;

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
    const proto = def.prototype;
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

    // check for treeshakable provider
    if (record === undefined) {

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

  private wrap(
    record: ProviderRecord,
    def: DefinitionRecord,
    instance: InstanceRecord,
    options?: InjectionOptions,
    session?: InjectionSession,
  ) {
    const newSession = InjectorMetadata.createSession(instance, options, session);
    const wrappers = this.getWrappers(record, newSession);

    const nextFn = (i = 0) => () => {
      if (i >= wrappers.length) {
        return def.factory(record.hostInjector, newSession);
      }
      const next: NextWrapper = nextFn(i + 1);
      return wrappers[i].wrapper(record.hostInjector, newSession, next);
    }
    return nextFn()();
  } 
}
