import { 
  InstanceRecord, InjectionOptions, InjectionMetadata, ProviderDef, DefinitionRecord, ScopeShape,
} from "../interfaces";
import { NOOP_FN, NULL_REF } from "../constants";

import { Context } from "./context";
import { Scope } from "../scope";
import { Token } from "../types";
import { ProviderRecord } from "./provider";
import { SessionStatus } from "../enums";

export class Session<T = any> {
  private status: SessionStatus = SessionStatus.NONE;

  constructor(
    public record: ProviderRecord<T>,
    public definition: DefinitionRecord<T>,
    public instance: InstanceRecord<T>,
    public options: InjectionOptions,
    public readonly meta: InjectionMetadata,
    public readonly parent: Session,
  ) {
    if (parent !== undefined) {
      // infer `ASYNC` status from parent
      this.status |= (parent.status & SessionStatus.ASYNC);
    }
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
    this.options.scope = this.options.scope || {} as ScopeShape;
    this.options.scope.kind = scope;
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
    if (sideEffect === true) {
      this.status |= SessionStatus.SIDE_EFFECTS;
    } else {
      this.status &= ~SessionStatus.SIDE_EFFECTS;
    }
  }

  hasSideEffect(): boolean {
    return (this.status & SessionStatus.SIDE_EFFECTS) > 0;
  }

  setAsync(async: boolean) {
    if (async === true) {
      this.status |= SessionStatus.ASYNC;
    } else {
      this.status &= ~SessionStatus.ASYNC;
    }
  }

  isAsync(): boolean {
    return (this.status & SessionStatus.ASYNC) > 0;
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

  copy(): Session {
    const newOptions = { ...this.options, labels: { ...this.options.labels } };
    const newSession = new Session(this.record, this.definition, this.instance, newOptions, this.meta, this.parent);
    newSession.status = this.status;
    return newSession;
  }

  fork = this.copy;

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
    factory: NOOP_FN,
    options: {
      provideIn: 'any',
      useWrapper: {
        func: (_, session: Session) => {
          const parent = session.parent;
          if (parent === undefined) {
            throw new Error('Session provider can be only used in other providers');
          }
          session.setSideEffect(true);
          return parent;
        }
      } as any,
    }
  };
}
