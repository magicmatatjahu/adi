import { InjectionToken } from "./injector";
import { Type, AbstractType } from "./interfaces";

export type Token<T = any> = string | symbol | InjectionToken<T> | Type<T> | AbstractType<T>;