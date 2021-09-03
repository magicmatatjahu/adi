import { Wrapper } from "@adi/core";
import { Token } from "@adi/core/lib/types";

export interface ComponentProvider<T = any> {
  name: Token<T>;
  component: React.JSXElementConstructor<T>;
  wrapper?: Wrapper;
}
