export interface OnInit {
  onInit(): void | Promise<void>;
}

export type StandaloneOnInit<T = any> = (value: T) => void | Promise<void>;

export interface OnDestroy {
  onDestroy(): void | Promise<void>;
}
