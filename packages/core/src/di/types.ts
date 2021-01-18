import { Type, AbstractType, InjectionArgument } from "./interfaces";
import { InjectionToken } from "./tokens";

export type Token<T = any> = string | symbol | InjectionToken<T> | Type<T> | AbstractType<T>;
export type InjectElement = Token | InjectionArgument;
