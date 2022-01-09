import { Context, Session, ProxyScope } from "@adi/core";

export interface ResolutionScopeOptions {
  reuseContext?: boolean;
}

const defaultOptions: ResolutionScopeOptions = {
  reuseContext: true,
}

export class ResolutionScope extends ProxyScope<ResolutionScopeOptions> {
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
