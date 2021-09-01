import { InjectionItem } from "./definition.interface";

export interface OnInit {
  onInit(): void | Promise<void>;
}

export type StandaloneOnInit<T = any> = 
  | ((value: T) => void | Promise<void>)
  | { onInit: (...args: any[]) => void | Promise<void>, inject: Array<InjectionItem> };

export interface OnDestroy {
  onDestroy(): void | Promise<void>;
}

export type StandaloneOnDestroy<T = any> = 
  | ((value: T) => void | Promise<void>)
  | { onDestroy: (...args: any[]) => void | Promise<void>, inject: Array<InjectionItem> };
