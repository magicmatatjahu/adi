import { 
  InstanceRecord, InjectionOptions, InjectionMetadata, ProviderDef, WrapperDef,
} from "../interfaces";

import { Context } from "./context";
import { Scope } from "../scope";
import { Token } from "../types";

export class Session<T = any> {
  private sideEffect: boolean = false;

  constructor(
    public instance: InstanceRecord<T>,
    public options: InjectionOptions,
    public meta: InjectionMetadata,
    public readonly parent: Session,
  ) {}

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

  getScope(): Scope {
    return this.options.scope;
  }

  setScope(scope: Scope) {
    this.options.scope = scope;
  }

  getLabels(): Record<string | symbol, any> {
    return this.options.labels;
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

  getInstance() {
    return this.instance;
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
