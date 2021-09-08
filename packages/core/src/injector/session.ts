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
  public status: SessionStatus = SessionStatus.NONE;

  constructor(
    public record: ProviderRecord<T>,
    public definition: DefinitionRecord<T>,
    public instance: InstanceRecord<T>,
    public options: InjectionOptions,
    public readonly metadata: InjectionMetadata,
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

  setAsync(async: boolean) {
    if (async === true) {
      this.status |= SessionStatus.ASYNC;
    } else {
      this.status &= ~SessionStatus.ASYNC;
    }
  }

  fork(): Session {
    const newOptions = { ...this.options, labels: { ...this.options.labels } };
    const newSession = new Session(this.record, this.definition, this.instance, newOptions, this.metadata, this.parent);
    newSession.status = this.status;
    return newSession;
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