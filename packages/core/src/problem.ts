import { ProviderToken } from "./interfaces";
import { InjectionToken } from "./tokens";

export class NoProviderError extends Error {
  constructor(token: ProviderToken) {
    let name: string;
    if (typeof token === 'function' || token instanceof InjectionToken) {
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
