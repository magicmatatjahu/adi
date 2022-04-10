import { ProviderToken } from "./interfaces";

export class NilInjectorError extends Error {
  constructor(token: ProviderToken) {
    const name = (token as any).name;
    super(`NilInjector: No provider for ${name || token}!`);
  }
}