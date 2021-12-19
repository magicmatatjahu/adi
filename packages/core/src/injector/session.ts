import { 
  InstanceRecord, InjectionOptions, InjectionMetadata, ProviderDef, DefinitionRecord, ScopeShape, Annotations,
} from "../interfaces";

import { Context } from "./context";
import { Injector } from "./injector";
import { Scope } from "../scope";
import { Token } from "../types";
import { ProviderRecord } from "./provider";
import { InjectionKind, SessionStatus } from "../enums";

function createOptions(token: Token): InjectionOptions {
  return {
    token,
    ctx: undefined,
    scope: undefined,
    annotations: {},
    injections: undefined,
  };
}

export class Session<T = any> {
  static create(
    token: Token,
    metadata?: InjectionMetadata,
    parent?: Session,
  ) {
    return new Session(void 0, void 0, void 0, createOptions(token), metadata, parent);
  }

  static createStandalone(
    token: Token,
    injector: Injector,
  ) {
    return new Session(void 0, void 0, void 0, createOptions(token), { target: injector, kind: InjectionKind.STANDALONE }, undefined);
  }

  public status: SessionStatus = SessionStatus.NONE;
  public injector: Injector;
  public shared: any;
  public meta: any;
  public local: any;

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
      this.shared = parent.shared;
    }
    this.shared = {};
    this.meta = {};
    this.local = {};
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

  setScope<T>(scope: Scope<T> | undefined, options?: T) {
    const scopeShape = this.options.scope = this.options.scope || {} as ScopeShape;
    scopeShape.kind = scope || scopeShape.kind;
    scopeShape.options = options || scopeShape.options;
  }

  getAnnotations(): Annotations {
    return this.options.annotations;
  }

  addAnnotations(annotations: Annotations): void;
  addAnnotations(key: string | symbol, value: any): void;
  addAnnotations(keyOrAnnotations: string | symbol | Annotations, value?: any) {
    if (typeof keyOrAnnotations === 'object') {
      this.options.annotations = { ...this.options.annotations, ...keyOrAnnotations };
    } else {
      this.options.annotations[keyOrAnnotations as any] = value;
    }
  }

  setFlag(flag: SessionStatus) {
    this.status |= flag;
  }

  removeFlag(flag: SessionStatus) {
    this.status &= ~flag;
  }

  hasFlag(flag: SessionStatus) {
    return (this.status & flag) > 0;
  }

  // remove that method
  setSideEffect(sideEffect: boolean) {
    if (sideEffect === true) {
      this.status |= SessionStatus.SIDE_EFFECTS;
    } else {
      this.status &= ~SessionStatus.SIDE_EFFECTS;
    }
  }

  // remove that method
  setAsync(async: boolean) {
    if (async === true) {
      this.status |= SessionStatus.ASYNC;
    } else {
      this.status &= ~SessionStatus.ASYNC;
    }
  }

  getHost(): Injector {
    if (this.parent) {
      return this.parent.record.host;
    }
    if (this.metadata.kind & InjectionKind.STANDALONE) {
      return this.metadata.target as Injector;
    }
    return;
  }

  fork(): Session {
    const newOptions: InjectionOptions = { ...this.options, annotations: { ...this.options.annotations } };
    const newSession = new Session(this.record, this.definition, this.instance, newOptions, this.metadata, this.parent);
    newSession.meta = { ...newSession.meta };
    newSession.local = { ...newSession.local };
    newSession.status = this.status;
    newSession.injector = this.injector;
    newSession.shared = this.shared;
    return newSession;
  }

  static $$prov: ProviderDef = {
    token: Session,
    factory: () => {},
    options: {
      provideIn: 'any',
      useWrapper: {
        func: (session: Session) => {
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
