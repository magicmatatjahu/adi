import { Injector, metadata, resolver, getNilInjector } from "../injector";
import { InjectionRecord, RecordDefinition, InjectionOptions, InjectionSession, ClassProvider, FactoryProvider, _CustomProvider } from "../interfaces";
import { Token } from "../types";
import { isFactoryProvider } from "../utils";

export interface DecoratorClassProvider<T = any> extends Omit<ClassProvider<T>, 'provide'> {
  decorate: Token<T>,
};

export interface DecoratorFactoryProvider<T = any> extends Omit<FactoryProvider<T>, 'provide'> {
  decorate: Token<T>,
}

export function useDecorator<T>(provider: DecoratorClassProvider<T> | DecoratorFactoryProvider<T>): _CustomProvider<T> {
  const nilInjector = getNilInjector();
  const provide = provider.decorate;

  return {
    provide,
    useCustom(record, def) {
      const previousDefaultDef = record.defaultDef;
      const decoratorDef = ensureDecoratorDef(record);
      decoratorDef.push(def);

      return function(injector: Injector, session: InjectionSession, sync?: boolean) {
        const currentDef = session.ctxRecord.def;
        const options = session.options;

        const def = findLastDefinition(currentDef, record, options, session, previousDefaultDef);
        record.defs = record.defs.filter(d => d !== currentDef);
        
        let decoratee = undefined;
        if (def === undefined) {
          let parentInjector = injector.getParentInjector();
          if (parentInjector === nilInjector) {
            return nilInjector.resolve(provide, options);
          }
          decoratee = parentInjector.resolveSync(provide, options, session);
        } else {
          decoratee = (injector as any).resolveDef(def, record, options, session, sync);
        }

        if (isFactoryProvider(provider)) {
          const deps = metadata.convertFactoryDeps(provider.inject || []);
          return provider.useFactory(decoratee, ...resolver.injectDepsSync(deps, injector, session));
        }
      }
    },
    when: provider.when,
    scope: provider.scope,
  };
}

function findLastDefinition(
  currentDef: RecordDefinition,
  record: InjectionRecord,
  options: InjectionOptions,
  session: InjectionSession,
  previousDefaultDef: RecordDefinition,
): RecordDefinition {
  const defs = record.defs;
  let seeCurrent = false;
  for (let i = defs.length - 1; i > -1; i--) {
    const d = defs[i];
    if (d.constraint(options, session) === true) {
      if (seeCurrent === true) return d;
      if (d === currentDef) seeCurrent = true;
    }
  }
  return currentDef === previousDefaultDef ? undefined : previousDefaultDef
}

const DECORATORS_SYMBOL = Symbol('DECORATORS_SYMBOL');
function ensureDecoratorDef(record: InjectionRecord): Array<RecordDefinition> {
  if (!record.hasOwnProperty(DECORATORS_SYMBOL)) {
    const decorators = [];
    Object.defineProperty(record, DECORATORS_SYMBOL, { value: decorators });
    const originalPush = record.defs.push;
    record.defs.push = (...items: any[]) => {
      const item = items[0];
      if (!decorators.some(i => i === item)) {
        return originalPush(item);
      }
      return record.defs.length + 1;
    }
  }
  return record[DECORATORS_SYMBOL];
}

// import { always } from "../bindings";
// import { InjectionRecord, RecordDefinition, InjectionOptions, InjectionSession, FactoryProvider, ConstraintFunction } from "../interfaces";
// import { ServiceLocator , InjectionSessionService } from "../services";
// import { Scope } from "../scopes";
// import { Token } from "../types";

// export interface DecoratorProvider<T = any, R = any>{
//   decorate: Token<T>,
//   action: (decoratee: T, ...deps: any[]) => R;
//   inject?: Array<Token | Array<ParameterDecorator>>;
//   when?: ConstraintFunction;
//   scope?: Scope;
// }

// export interface DecoratorClassProvider<T = any, R = any>{
//   decorate: Token<T>,
// }

// export function useDecorator<T>(provider: DecoratorProvider<T>): FactoryProvider<T> {
//   const provide = provider.decorate;

//   return {
//     provide,
//     useFactory(locator: ServiceLocator, session: InjectionSessionService, ...deps: any[]): Promise<T> {
//       const currentSession = session._session();
//       const options = currentSession?.options;
//       const parentSession = currentSession?.parent;
//       const sync = session.isSyncInjection();
//       const currentDef = currentSession.ctxRecord.def;
//       const record = currentDef.record;

//       const injector = (locator as any).injector;
//       const def = findLastDefinition(currentDef, record, options, parentSession);
//       let decoratee = undefined;

//       if (def === undefined) {
//         // TODO: Change it
//         const parentInjector = injector.getParentInjector();
//         if (parentInjector === null) {
//           return undefined;
//         }
//         decoratee = parentInjector.resolveSync(provide, options, parentSession);
//       } else {
//         decoratee = injector.resolveDef(def, record, options, parentSession, sync);
//       }
//       return provider.action(decoratee, ...deps);
//     },
//     inject: [ServiceLocator, InjectionSessionService, ...(provider.inject || [])],
//     when: provider.when,
//     scope: provider.scope,
//   };
// }

// function findLastDefinition(
//   currentDef: RecordDefinition,
//   record: InjectionRecord,
//   options: InjectionOptions,
//   session?: InjectionSession
// ): RecordDefinition {
//   const defs = record.defs;
//   let current = false;
//   for (let i = defs.length - 1; i > -1; i--) {
//     const d = defs[i];
//     if (d.constraint(options, session) === true) {
//       if (current === true) return d;
//       if (d === currentDef) current = true;
//     }
//   }
//   const fallback = currentDef.previousDef || record.defaultDef.previousDef || record.defaultDef;
//   return currentDef === fallback ? undefined : fallback
// }
