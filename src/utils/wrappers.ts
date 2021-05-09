import { Injector } from "../injector";
import { InjectionSession, NextWrapper, WrapperDef, WrapperOptions } from "../interfaces";
import { Token } from "../types";

// TODO: Improve inheritance of wrappers in extending case - it should be new wrappers, not these same as in parent class
export function createWrapper<T = any>(
  useWrapper: (options?: T) => WrapperDef,
  wrapperOptions?: WrapperOptions,
): (options?: T | WrapperDef, next?: WrapperDef) => WrapperDef {
  const wr = (optionsOrWrapper?: T | WrapperDef, next?: WrapperDef): WrapperDef => {
    // case when defined wrapper
    if (optionsOrWrapper && optionsOrWrapper.hasOwnProperty('$$nextWrapper')) {
      const v = useWrapper();
      v['$$wrapperDef'] = useWrapper;
      v['$$nextWrapper'] = optionsOrWrapper;
      v['$$options'] = undefined;
      return v;
    }
    const v = (useWrapper as any)(optionsOrWrapper) as WrapperDef;
    v['$$wrapperDef'] = useWrapper;
    v['$$nextWrapper'] = next;
    v['$$options'] = optionsOrWrapper;
    return v;
  }
  return wr;
}

// change last `next` function to custom function passed by function argument
export function execWrapper(nextWrapper: WrapperDef, last: NextWrapper) {
  return (injector: Injector, s: InjectionSession) => {
    const $$nextWrapper = nextWrapper['$$nextWrapper'];
    if ($$nextWrapper !== undefined) {
      const next: NextWrapper = execWrapper($$nextWrapper, last);
      return nextWrapper(injector, s, next);
    }
    // fix passing options
    // const next: NextWrapper = (i: Injector, s: InjectionSession) => (i as any).retrieveRecord(s.options.token || token, s.options, s);
    return nextWrapper(injector, s, last);
  }
}

// copy wrapper chain in inheritance case
export function copyWrapper<T = any>(wrapper: ReturnType<typeof createWrapper>) {

}
