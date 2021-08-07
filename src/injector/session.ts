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

  setContext(ctx: Context) {
    this.options.ctx = ctx;
  }

  setScope(scope: Scope) {
    this.options.scope = scope;
  }

  addLabels(labels: Record<string | symbol, any>) {
    this.options.labels = { ...this.options.labels, ...labels };
  }

  // TODO: implement
  useWrapper(wrapper: WrapperDef) {
  }

  setSideEffect(sideEffect: boolean) {
    this.sideEffect = sideEffect;
  }

  hasSideEffect(): boolean {
    return this.sideEffect;
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
      const parentSession = session.parent;
      if (parentSession === undefined) {
        throw new Error('Session provider can be only used in other providers');
      }
      return parentSession;
    },
    provideIn: 'any',
    // scope: Scope.INSTANCE is added in `index.ts` file due to circular references between `injector` dir and `scope` file  
  };
}
