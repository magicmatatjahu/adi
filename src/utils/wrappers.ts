import { WrapperDef, WrapperOptions } from "../interfaces";

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

export function copyWrapper<T = any>(wrapper: ReturnType<typeof createWrapper>) {

}
