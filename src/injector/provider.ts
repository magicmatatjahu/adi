import { Injector, Context, Session } from ".";
import { STATIC_CONTEXT, ALWAYS_CONSTRAINT } from "../constants";
import { InjectionStatus } from "../enums";
import { Type, DefinitionRecord, InstanceRecord, WrapperRecord, FactoryDef, ConstraintDef, WrapperDef, ScopeShape } from "../interfaces";
import { Token } from "../types";
import { Scope } from "../scope";
import { useDefaultHooks } from "../wrappers";
import { Wrapper } from "../utils/wrappers";

export class ProviderRecord<T = any> {
  readonly defs: Array<DefinitionRecord> = [];
  readonly constraintDefs: Array<DefinitionRecord> = [];
  readonly wrappers: Array<WrapperRecord> = [];

  constructor(
    readonly token: Token<T>,
    readonly host: Injector,
  ) {}

  getInstance<S>(
    def: DefinitionRecord<T>, 
    scope: Scope<S>,
    scopeOptions: S,
    session: Session,
  ): InstanceRecord<T> {
    const ctx = scope.getContext(session, scopeOptions, this.host) || STATIC_CONTEXT;
    let instance = def.values.get(ctx);
    if (instance === undefined) {
      instance = {
        ctx,
        value: undefined,
        def,
        status: InjectionStatus.UNKNOWN,
      };
      def.values.set(ctx, instance);
      // if (scope.toCache(options, def, session) === true) {
      //   ctxRecord.status |= InjectionStatus.CACHED;
      //   def.values.set(ctx, ctxRecord);
      // }
    }
    // remove it when new wrappers will be added
    session.setInstance(instance);
    return instance;
  }

  addDefinition<T, S>(
    factory?: FactoryDef,
    scope?: ScopeShape<S>,
    constraint?: ConstraintDef,
    wrapper?: Wrapper,
    annotations?: Record<string | symbol, any>,
    proto?: Type,
  ): void {
    // console.log(scope)
    if (scope === undefined) {
      scope = {
        which: Scope.DEFAULT,
        options: undefined,
      }
    }
    // if provider is a class provider, then apply hooks wrappers
    if (proto !== undefined) {
      wrapper = useDefaultHooks(wrapper);
    }
    const def: DefinitionRecord = {
      record: this as any,
      factory,
      scope,
      constraint,
      wrapper,
      annotations,
      proto: proto || undefined,
      values: new Map<Context, InstanceRecord<T>>(),
    };
    if (constraint === undefined) {
      this.defs.push(def);
    } else {
      this.constraintDefs.push(def);  
    }
  }

  addWrapper(
    wrapper: Wrapper,
    constraint: ConstraintDef,
  ): void {
    this.wrappers.push({
      wrapper,
      constraint: constraint || ALWAYS_CONSTRAINT,
    });
  }

  getDefinition(
    session?: Session
  ): DefinitionRecord | undefined {
    const constraintDefs = this.constraintDefs;
    for (let i = constraintDefs.length - 1; i > -1; i--) {
      const def = constraintDefs[i];
      if (def.constraint(session) === true) {
        return def;
      }
    }
    if (this.defs.length) {
      return this.defs[this.defs.length - 1];
    }
    return undefined;
  }

  filterWrappers(
    session?: Session
  ): Array<Wrapper> {
    const wrappers = this.wrappers, satisfyingWraps = [];
    for (let i = 0, l = wrappers.length; i < l; i++) {
      const wrapper = wrappers[i];
      if (wrapper.constraint(session) === true) {
        satisfyingWraps.push(wrapper.wrapper);
      }
    }
    return satisfyingWraps;
  }
}
