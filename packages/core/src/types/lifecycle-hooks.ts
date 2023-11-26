import type { InjectionItem } from "./injection";

export interface OnInit {
  onInit(...args: any[]): void | Promise<void>;
}

export interface OnDestroy {
  onDestroy(...args: any[]): void | Promise<void>;
}

export interface OnDestroyOptions<T = any> {
  onDestroy: (value: T, ...args: any[]) => any;
  inject?: Array<InjectionItem>;
}

export interface DestroyContext {
  event: 'default' | 'injector' | 'manually' | 'dispose';
}

export interface InjectorDestroyContext {
  event: 'default' | 'manually' | 'dispose';
}
