import { Injector, Context, Session } from ".";
import { STATIC_CONTEXT, ALWAYS_CONSTRAINT, ANNOTATIONS, MODULE_INITIALIZERS } from "../constants";
import { InjectorStatus, InstanceStatus } from "../enums";
import { Type, DefinitionRecord, InstanceRecord, WrapperRecord, FactoryDef, ConstraintDef, ScopeShape } from "../interfaces";
import { Token } from "../types";
import { Scope } from "../scope";
import { Wrapper, compareOrder } from "../utils";

export class ProviderRecord<T = any> {
  readonly defs: Array<DefinitionRecord> = [];
  readonly constraintDefs: Array<DefinitionRecord> = [];
  readonly wrappers: Array<WrapperRecord> = [];

  constructor(
    readonly token: Token<T>,
    readonly host: Injector,
    readonly isComponent: boolean = false,
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
        status: InstanceStatus.UNKNOWN,
        scope,
        donePromise: undefined,
        doneResolve: undefined,
        // what is injected to instance
        children: undefined,
        // where instance is injected
        parents: undefined,
      };
      def.values.set(ctx, instance);
    }

    // add links
    const parent = session.parent;
    if (parent !== undefined) {
      const parentInstance = parent.instance;
      // TODO: retrieve first instance
      if (parentInstance !== undefined) {
        (parentInstance.children || (parentInstance.children = new Set())).add(instance);
        (instance.parents || (instance.parents = new Set())).add(parentInstance);
      }
    }

    return instance;
  }

  addDefinition<T, S>(
    factory?: FactoryDef,
    scope?: ScopeShape<S>,
    constraint?: ConstraintDef,
    wrapper?: Wrapper,
    annotations?: Record<string | symbol, any>,
    proto?: Type,
  ): DefinitionRecord {
    const def: DefinitionRecord = {
      name: annotations[ANNOTATIONS.NAME],
      values: new Map<Context, InstanceRecord<T>>(),
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
    };

    // add definition to the defs/constraintDefs array
    if (constraint === undefined) {
      this.defs.push(def);
    } else {
      this.constraintDefs.push(def);  
    }

    // check if definition must be resolved with MODULE_INITIALIZERS
    // add def only to the MODULE_INITIALIZERS definitions when injector isn't initialized
    if (annotations[ANNOTATIONS.EAGER] === true && (this.host.status & InjectorStatus.INITIALIZED) === 0) {
      const moduleInitializers = this.host.getRecord(MODULE_INITIALIZERS);
      moduleInitializers.defs.push(def);
    }

    return def;
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
