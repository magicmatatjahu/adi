import { FunctionInjections } from "./injection.interface";

export interface OnInit {
  onInit(): void | Promise<void>;
}

export type StandaloneOnInit<T = any> = 
  | ((value: T) => void | Promise<void>)
  | { onInit: (...args: any[]) => void | Promise<void> } & FunctionInjections;

export interface OnDestroy {
  onDestroy(): void | Promise<void>;
}

export type StandaloneOnDestroy<T = any> = 
  | ((value: T) => void | Promise<void>)
  | { onDestroy: (...args: any[]) => void | Promise<void> } & FunctionInjections;

export type DestroyEvent = 'default' | 'injector' | 'manually';
