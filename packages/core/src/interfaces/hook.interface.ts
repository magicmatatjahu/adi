import { FunctionInjections } from "./injection.interface";

export interface OnInit {
  onInit(): void | Promise<void>;
}

export interface StandaloneOnInit<T = any> extends FunctionInjections { 
  onInit: (value: T, ...args: any[]) => void | Promise<void> 
};

export interface OnDestroy {
  onDestroy(): void | Promise<void>;
}

export interface StandaloneOnDestroy<T = any> extends FunctionInjections {
  onDestroy: (value: T, ...args: any[]) => void | Promise<void> 
}

export type DestroyEvent = 'default' | 'injector' | 'manually';
