import { Context } from "./injector";

export const STATIC_CONTEXT = new Context({}, "STATIC_CONTEXT");

export const NOOP_CONSTRAINT = () => true;
export const TRUE_CONSTRAINT = () => true;
export const FALSE_CONSTRAINT = () => false;
