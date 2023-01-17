import { isInjectionToken } from "./utils";

import type { Session } from "./injector";

export class NoProviderError extends Error {
  constructor(session: Session) {
    const token = session.iOptions.token;

    let name: string;
    if (typeof token === 'function' || isInjectionToken(token)) {
      name = token.name;
    } else if (typeof token === 'symbol') {
      name = token.toString();
    } else {
      name = token;
    }
    super(`No provider for ${name}!`);
  }
}

export class CircularReferenceError extends Error {
  constructor() {
    super(`Component provider cannot be injected to another provider!`);
  }
}

export class ComponentProviderError extends Error {
  constructor() {
    super(`Compp!`);
  }
}
