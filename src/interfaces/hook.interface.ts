export interface OnInit {
  onInit(): void | Promise<void>;
}

export interface OnDestroy {
  onDestroy(): void | Promise<void>;
}
