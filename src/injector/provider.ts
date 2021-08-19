import { Injector, Context, Session } from ".";
import { STATIC_CONTEXT, ALWAYS_CONSTRAINT, ANNOTATIONS, EMPTY_ARRAY } from "../constants";
import { InjectionStatus } from "../enums";
import { Type, DefinitionRecord, InstanceRecord, WrapperRecord, FactoryDef, ConstraintDef, ScopeShape } from "../interfaces";
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
    scope: ScopeShape<S>,
    session: Session,
  ): InstanceRecord<T> {
    const ctx = scope.kind.getContext(session, scope.options, this.host) || STATIC_CONTEXT;
    let instance = def.values.get(ctx);
    if (instance === undefined) {
      instance = {
        ctx,
        value: undefined,
        def,
        status: InjectionStatus.UNKNOWN,
        // scope,
        // scopeOptions,
        // children: new Set(),
        // parents: new Set(),
      };
      def.values.set(ctx, instance);
    }

    // // add links
    // const parent = session.getParent();
    // if (parent !== undefined) {
    //   const parentInstance = parent.instance;
    //   // TODO: retrieve first instance
    //   if (parentInstance !== undefined) {
    //     parentInstance.children.add(instance);
    //     instance.parents.add(parentInstance);
    //   }
    // }

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
    // if provider is a class provider, then apply hooks wrappers
    if (proto !== undefined) {
      wrapper = useDefaultHooks(wrapper);
    }
    const def: DefinitionRecord = {
      record: this as any,
      factory,
      scope: scope || {
        kind: Scope.DEFAULT,
        options: undefined,
      },
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
    constraint?: ConstraintDef,
    annotations?: Record<string | symbol, any>,
  ): void {
    this.wrappers.push({
      wrapper,
      constraint: constraint || ALWAYS_CONSTRAINT,
      annotations,
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
    const wrappers = this.wrappers, satisfyingWraps: WrapperRecord[] = [];
    for (let i = 0, l = wrappers.length; i < l; i++) {
      const wrapper = wrappers[i];
      if (wrapper.constraint(session) === true) {
        satisfyingWraps.push(wrapper);
      }
    }
    return satisfyingWraps.sort(compareOrder).map(record => record.wrapper);
  }
}

function compareOrder(a: WrapperRecord, b: WrapperRecord): number {
  return (a.annotations[ANNOTATIONS.ORDER] as number || 0) - (b.annotations[ANNOTATIONS.ORDER] as number || 0);
}