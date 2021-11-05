import { Context, Session } from "../injector";
import { SessionStatus } from "../enums";

import { Scope } from "./index";
import { DefinitionRecord } from "../interfaces";

export interface RequestShape {
  name: string;
  def: DefinitionRecord;
  factory: () => any;
}

export class ProxyObject {
  constructor(
    readonly name: string,
    readonly def: DefinitionRecord,
  ) {}
}

export interface RequestScopeOptions {
  reuseContext?: boolean;
}

const defaultOptions: RequestScopeOptions = {
  reuseContext: true,
}

export class RequestScope extends Scope<RequestScopeOptions> {
  private requestContext: Context = new Context();

  get name() {
    return 'Request';
  }

  public getContext(session: Session, options: RequestScopeOptions = defaultOptions): Context {
    if (session.status & SessionStatus.PROXY_MODE) {
      return new Context(session.shared.requestData);
    }

    this.applyProxy(session);
    // return placeholder context
    return this.requestContext;
  }

  public create(
    session: Session,
    options: RequestScopeOptions,
  ) {
    if (session.status & SessionStatus.PROXY_MODE) {
      return super.create(session, options);
    }
    return new ProxyObject(this.name, session.definition);
  }

  // TODO: Destroy only when user destroy manually
  public canDestroy(): boolean {
    // always destroy
    return true;
  };

  private applyProxy(session: Session) {
    const requestShape: RequestShape = {
      name: this.name,
      def: session.definition,
      factory: () => {
        session.status |= SessionStatus.PROXY_MODE;
        // TODO: Don't save instance to the values Map
        return session.injector.resolveDefinition(session.definition, session); //session.definition.factory(session.injector, session)
      },
    };

    let parent = session.parent;
    while (parent) {
      const def = parent.definition;
      if (def) {
        const proxies: Array<RequestShape> = def.meta.proxyInstances = def.meta.proxyInstances || [];
        if (proxies.some(p => p.name === this.name && p.def === session.definition)) {
          break;
        }
        proxies.push(requestShape);
      }
      parent = parent.parent;
    }
  }
}
