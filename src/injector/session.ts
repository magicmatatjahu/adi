import { 
  InstanceRecord, InjectionOptions, InjectionMetadata, ProviderDef, DefinitionRecord, ScopeShape,
} from "../interfaces";
import { NULL_REF } from "../constants";

import { Context } from "./context";
import { Scope } from "../scope";
import { Token } from "../types";
import { ProviderRecord } from "./provider";

export class Session<T = any> {
  private sideEffect: boolean = false;

  constructor(
    public record: ProviderRecord<T>,
    public definition: DefinitionRecord<T>,
    public instance: InstanceRecord<T>,
    public options: InjectionOptions,
    public meta: InjectionMetadata,
    public readonly parent: Session,
  ) {
    // TODO: Fix options
    this.options = this.options || {} as any;
    this.options.scope = this.options.scope || {} as ScopeShape;
  }

  getToken(): Token {
    return this.options.token;
  }

  setToken(token: Token) {
    this.options.token = token;
  }

  getContext(): Context {
    return this.options.ctx;
  }

  setContext(ctx: Context) {
    this.options.ctx = ctx;
  }

  getScope(): ScopeShape {
    return this.options.scope;
  }

  setScope<T>(scope: Scope<T>, options?: T) {
    this.options.scope.which = scope;
    this.options.scope.options = options;
  }

  getLabels(): Record<string | symbol, any> {
    return this.options.labels;
  }

  addLabel(key: string | symbol, value: any) {
    this.options.labels[key as any] = value;
  }

  addLabels(labels: Record<string | symbol, any>) {
    this.options.labels = { ...this.options.labels, ...labels };
  }

  setSideEffect(sideEffect: boolean) {
    this.sideEffect = sideEffect;
  }

  hasSideEffect(): boolean {
    return this.sideEffect;
  }

  getRecord() {
    return this.record;
  }

  setRecord(record: ProviderRecord) {
    this.record = record;
  }

  getDefinition() {
    return this.definition;
  }

  setDefinition(def: DefinitionRecord) {
    this.definition = def;
  }

  getInstance() {
    return this.instance;
  }

  setInstance(instance: InstanceRecord) {
    this.instance = instance;
  }

  getOptions() {
    return this.options;
  }

  getMetadata() {
    return this.meta;
  }

  getParent() {
    return this.parent;
  }

  // TODO: maybe `leaveInstance` argument is unnecessary, or not...
  copy(leaveInstance: boolean = false): Session {
    const newOptions = { ...this.options, labels: { ...this.options.labels } };
    // if (leaveInstance === false) {
    //   return new Session(undefined, newOptions, this.meta, this.parent);
    // }
    return new Session(this.record, this.definition, this.instance, newOptions, this.meta, this.parent);
  }

  retrieveDeepMeta(key: string) {
    let tempSession: Session = this;
    while (tempSession.hasOwnProperty(key) === false && tempSession.parent) {
      tempSession = tempSession.parent || NULL_REF as any;
    }
    if (tempSession.hasOwnProperty(key)) {
      return tempSession[key];
    }
    return NULL_REF;
  }

  static $$prov: ProviderDef = {
    token: Session,
    factory: (_, session) => {
      const parentSession = session.getParent();
      if (parentSession === undefined) {
        throw new Error('Session provider can be only used in other providers');
      }
      return parentSession;
    },
    provideIn: 'any',
    // scope: Scope.INSTANCE is added in `index.ts` file due to circular references between `injector` dir and `scope` file  
  };
}
