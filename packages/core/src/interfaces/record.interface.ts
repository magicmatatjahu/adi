import { Context, ProviderRecord } from "../injector";
import { InstanceStatus } from "../enums";
import { ConstraintDef, FactoryDef, ScopeShape, Type } from ".";
import { Wrapper } from "../utils/wrappers";
import { Annotations } from "./common.interface";

export interface DefinitionRecord<T = any, S = any> {
  name: string | symbol;
  values: Map<Context, InstanceRecord<T>>;
  record: ProviderRecord<T>;
  factory: FactoryDef<T> | undefined;
  constraint: ConstraintDef | undefined;
  wrapper: Wrapper | Array<Wrapper>;
  scope: ScopeShape<S>;
  annotations: Annotations;
  proto: Type<T> | undefined;
  meta: Record<string | symbol, any>;
}

export interface InstanceRecord<T = any> {
  ctx: Context,
  value: T;
  status: InstanceStatus;
  def: DefinitionRecord;
  scope: ScopeShape;
  // for pararell resolution
  donePromise?: Promise<T>;
  doneResolve?: (value: T) => void;
  // what is injected to instance
  children?: Set<InstanceRecord>;
  // where instance is injected
  parents?: Set<InstanceRecord>;
  meta: Record<string | symbol, any>;
}

export interface WrapperRecord {
  wrapper: Wrapper | Array<Wrapper>;
  constraint: ConstraintDef;
  annotations: Annotations;
}
