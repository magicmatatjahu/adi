import { ProviderToken, Annotations } from "@adi/core";
import { Wrapper } from "@adi/core/lib/utils/wrappers";

import { useInject } from "./useInject";

export function useComponent<T = any>(component: ProviderToken, annotations?: Annotations): React.JSXElementConstructor<React.PropsWithChildren<T>>;
export function useComponent<T = any>(component: ProviderToken, hook?: Wrapper | Array<Wrapper>, annotations?: Annotations): React.JSXElementConstructor<React.PropsWithChildren<T>>;
export function useComponent<T = any>(component: ProviderToken<T>, hook?: Wrapper | Array<Wrapper> | Annotations, annotations?: Annotations): React.JSXElementConstructor<React.PropsWithChildren<T>> {
  return useInject(component, hook as any, annotations) as unknown as React.JSXElementConstructor<React.PropsWithChildren<T>>;
}
