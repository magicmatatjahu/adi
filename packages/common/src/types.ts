export interface GenericHook {};

export type Token<T, R = T> = R;
export type Optional<T> = T | undefined;
export type New<T> = T;
export type Lazy<T> = T;