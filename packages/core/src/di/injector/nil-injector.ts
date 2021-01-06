import { Injector } from "./injector";
import { InjectionFlags } from "../enums";
import { InjectionOptions } from "../interfaces";
import { Token } from "../types"

export class NilInjector {
  resolve(
    token: Token,
    options: InjectionOptions,
  ): never | undefined {
    if (options.flags & InjectionFlags.OPTIONAL) {
      return options.default;
    }
    throw new Error(`Undefined token: ${token as string}`);
  }

  getParentInjector(): Injector | null {
    return null;
  }
};
