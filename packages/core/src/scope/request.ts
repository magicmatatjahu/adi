import { Context, Session } from "../injector";
import { SessionStatus } from "../enums";
import { DefinitionRecord, DestroyEvent } from "../interfaces";
import { Scope } from "./index";

export class ProxyPlaceholder {
  constructor(
    readonly id: string | symbol,
    readonly def: DefinitionRecord,
  ) {}
}

export interface ProxyRecord {
  id: string | symbol;
  def: DefinitionRecord;
  factory: (data: object) => any;
}

export interface ProxyInstance {
  id: string | symbol;
  def: DefinitionRecord;
  value: any;
}

export abstract class ProxyScope<O> extends Scope<O> {
  abstract getProxyContext(
    session: Session, 
    options: O,
  ): Context;

  abstract getPlaceholderContext(
    session: Session, 
    options: O,
  ): Context;

  abstract getID(
    session: Session, 
    options: O,
  ): string | symbol;

  public getContext(session: Session, options: O): Context {
    if (session.status & SessionStatus.PROXY_MODE) {
      return this.getProxyContext(session, options);
    }

    this.applyProxy(session, options);

    // return placeholder context
    return this.getPlaceholderContext(session, options);
  }

  public create(
    session: Session,
    options: O,
  ) {
    if (session.status & SessionStatus.PROXY_MODE) {
      session.shared.proxies.push(session.instance);
      return super.create(session, options);
    }
    return new ProxyPlaceholder(this.getID(session, options), session.definition);
  }

  public canDestroy(event: DestroyEvent): boolean {
    // destroy only when user destroy manually
    return event === 'manually';
  };

  protected applyProxy(session: Session, options: O) {
    const proxyID = this.getID(session, options);
    const proxyRecord: ProxyRecord = {
      id: proxyID,
      def: session.definition,
      factory: (data: object) => {
        const fork = session.fork();
        fork.shared = Object.assign(fork.shared, data);
        fork.status |= SessionStatus.PROXY_MODE;
        return session.injector.resolveDefinition(session.definition, fork);
      },
    };

    let parent = session.parent;
    while (parent) {
      const def = parent.definition;
      if (def) {
        const proxies: Array<ProxyRecord> = def.meta.proxies = def.meta.proxies || [];
        if (proxies.some(p => p.id === proxyID && p.def === session.definition)) {
          break;
        }
        proxies.push(proxyRecord);
      }
      parent = parent.parent;
    }
  }
}

export interface RequestScopeOptions {
  reuseContext?: boolean;
}

const defaultOptions: RequestScopeOptions = {
  reuseContext: true,
}

export class RequestScope extends ProxyScope<RequestScopeOptions> {
  private placeholderContext = new Context();

  get name() {
    return 'Request';
  }

  getProxyContext(
    session: Session, 
  ): Context {
    return new Context(session.shared.requestData);
  };

  getPlaceholderContext(): Context {
    return this.placeholderContext;
  };

  getID(): string | symbol {
    return this.name;
  }
}
