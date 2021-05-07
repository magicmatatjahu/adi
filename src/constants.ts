import { Context } from "./injector";

export const STATIC_CONTEXT = new Context();

export const NOOP_CONSTRAINT = () => true;
export const TRUE_CONSTRAINT = () => true;
export const FALSE_CONSTRAINT = () => false;
