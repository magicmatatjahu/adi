import { InjectionItem, Injector } from "@adi/core";
import { Token } from "@adi/core/lib/types";
import { isWrapper } from "@adi/core/lib/utils";

export function injectArray(injector: Injector, injections: Array<InjectionItem>): any[] {
  return injections.map(injectionItem => inject(injector, injectionItem));
}

export function injectMap(injector: Injector, injections: Record<string | symbol, InjectionItem>): Record<string | symbol, any> {
  return Object.keys(injections).reduce((result, key) => {
    result[key] = inject(injector, injections[key]);
    return result;
  }, {});
}

function inject<T>(injector: Injector, injectionItem: InjectionItem<T>): T {
  if (isWrapper(injectionItem)) {
    return injector.get(undefined, injectionItem);
  }
  if ((injectionItem as any).token !== undefined) {
    return injector.get((injectionItem as any).token, (injectionItem as any).wrapper);
  }
  return injector.get(injectionItem as Token);
}
