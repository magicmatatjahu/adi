import { always } from "../bindings";
import { InjectionRecord, RecordDefinition, InjectionOptions, InjectionSession, FactoryProvider, ConstraintFunction } from "../interfaces";
import { ServiceLocator , InjectionSessionService } from "../services";
import { Scope } from "../scopes";
import { Token } from "../types";

export interface DecoratorProvider<T = any, R = any>{
  decorate: Token<T>,
  action: (decoratee: T, ...deps: any[]) => R;
  inject?: Array<Token | Array<ParameterDecorator>>;
  when?: ConstraintFunction;
  scope?: Scope;
}

export interface DecoratorClassProvider<T = any, R = any>{
  decorate: Token<T>,
}

export function useDecorator<T>(provider: DecoratorProvider<T>): FactoryProvider<T> {
  const provide = provider.decorate;

  return {
    provide,
    useFactory(locator: ServiceLocator, session: InjectionSessionService, ...deps: any[]): Promise<T> {
      const currentSession = session._session();
      const options = currentSession?.options;
      const parentSession = currentSession?.parent;
      const sync = session.isSyncInjection();
      const currentDef = currentSession.ctxRecord.def;
      const record = currentDef.record;

      const injector = (locator as any).injector;
      const def = findLastDefinition(currentDef, record, options, parentSession);
      let decoratee = undefined;

      if (def === undefined) {
        // TODO: Change it
        const parentInjector = injector.getParentInjector();
        if (parentInjector === null) {
          return undefined;
        }
        decoratee = parentInjector.resolveSync(provide, options, parentSession);
      } else {
        decoratee = injector.resolveDef(def, record, options, parentSession, sync);
      }
      return provider.action(decoratee, ...deps);
    },
    inject: [ServiceLocator, InjectionSessionService, ...(provider.inject || [])],
    when: provider.when,
    scope: provider.scope,
  };
}

function findLastDefinition(
  currentDef: RecordDefinition,
  record: InjectionRecord,
  options: InjectionOptions,
  session?: InjectionSession
): RecordDefinition {
  const defs = record.defs;
  let current = false;
  for (let i = defs.length - 1; i > -1; i--) {
    const d = defs[i];
    if (d.constraint(options, session) === true) {
      if (current === true) return d;
      if (d === currentDef) current = true;
    }
  }
  const fallback = currentDef.previousDef || record.defaultDef.previousDef || record.defaultDef;
  return currentDef === fallback ? undefined : fallback
}
