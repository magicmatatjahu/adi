export interface OnInit {
  onInit(...args: any[]): void | Promise<void>;
}

export interface OnDestroy {
  onDestroy(...args: any[]): void | Promise<void>;
}

export interface DestroyContext {
  event: 'default' | 'injector' | 'manually' | 'dispose';
}
