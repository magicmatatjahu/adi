import { getProviderDef } from "../decorators";
import { Context, Injector, NilInjector, InjectorMetadata, InjectorResolver } from "../injector";
import { InjectionArgument, InjectionSession, NextWrapper, WrapperDef, Type } from "../interfaces";
import { Scope } from "../scope";
import { Token as ProviderToken } from "../types";
import { createWrapper } from "../utils";
import { CONSTRAINTS } from "../constants";

export const Token = createWrapper((token: ProviderToken): WrapperDef => {
  // console.log('token');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside token');
    session.options = session.options || {} as any;
    session.options.token = token || session.options.token;
    return next(injector, session);
  }
});

export const Ref = createWrapper((ref: () => ProviderToken): WrapperDef => {
  // console.log('ref');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside ref');
    session.options = session.options || {} as any;
    session.options.token = ref();
    return next(injector, session);
  }
});

export const Optional = createWrapper((defaultValue?: any): WrapperDef => {
  // console.log('optional');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside optional');
    try {
      return next(injector, session);
    } catch(err) {
      if ((err as any).NilInjectorError === true) return defaultValue;
      throw err;
    }
  }
});

// skip injection
export const Skip = createWrapper((value?: any): WrapperDef => {
  // console.log('noinject');
  return () => {
    // console.log('inside noinject');
    return value;
  }
});

export const Scoped = createWrapper((scope: Scope): WrapperDef => {
  // console.log('scoped');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside scope');
    session.options.scope = scope;
    return next(injector, session);
  }
});

export const New = createWrapper((ctxData: any): WrapperDef => {
  // console.log('new');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside new');
    if (ctxData !== undefined) {
      session.options.ctx = new Context(ctxData);
    }
    session.options.scope = Scope.TRANSIENT;
    return next(injector, session);
  }
});

export const Self = createWrapper((_: never): WrapperDef => {
  // console.log('self');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside self');
    const token = session.options.token;
    // check for treeshakable provider
    (injector as any).getRecord(token);
    const ownRecord = (injector as any).records.get(token);
    // if token is not found
    if (ownRecord === undefined) {
      return next(NilInjector, session);
    }
    return next(injector, session);
  }
});

export const SkipSelf = createWrapper((_: never): WrapperDef => {
  // console.log('skipSelf');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside skipSelf');
    const token = session.options.token;
    let parentInjector = injector.getParentInjector();
    // check for treeshakable provider
    (injector as any).getRecord(token);
    const ownRecord = (injector as any).records.get(token);

    while (parentInjector !== NilInjector) {
      (parentInjector as any).getRecord(token);
      if (
        (parentInjector as any).records.get(token) ||
        (parentInjector as any).importedRecords.get(token) !== ownRecord
      ) {
        return next(parentInjector, session);
      }
      parentInjector = parentInjector.getParentInjector();
    }
    return next(NilInjector, session);
  }
});

export const Named = createWrapper((name: string): WrapperDef => {
  // console.log('named');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside named');
    session.options.labels[CONSTRAINTS.NAMED] = name;
    return next(injector, session);
  }
});

export const Labeled = createWrapper((labels: Record<string | symbol, any>): WrapperDef => {
  // console.log('labeled');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside labeled');
    session.options.labels = Object.assign(session.options.labels, labels);
    return next(injector, session);
  }
});

export const Fallback = createWrapper((token: ProviderToken): WrapperDef => {
  // console.log('fallback');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside fallback');
    try {
      return next(injector, session);
    } catch(err) {
      if ((err as any).NilInjectorError === true) {
        session.options = session.options || {} as any;
        session.options.token = token;
        return next(injector, session);
      }
      throw err;
    }
  }
});

export const Multi = createWrapper((_: never): WrapperDef => {
  // console.log('multi');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside multi');
    // exec wrappers chain to retrieve needed, updated session
    next(injector, session);
    const options = session.options;
    const instantietedInstance = session.instance;
    const instantietedDef = instantietedInstance.def;
    const token = options.token || instantietedInstance.def.record.token;
    const record = (injector as any).records.get(token);
    const defs = (injector as any).getDefinitions(record, session);
    // TODO: improve function to pass wrappers chain again and maybe copy of session
    // add also check for side effects
    // passing wrappers again solve the issue when dev pass several wrappers on provider using standalone useWrapper provider (without constraint) 
    const values = [];
    for (let i = 0, l = defs.length; i < l; i++) {
      const def = defs[i];
      if (def === instantietedDef) {
        values.push(instantietedInstance.value);
      } else {
        values.push((injector as any).resolveDef(def, options, session));
      }
    }
    return values;
  }
});

interface DecorateOptions {
  decorator: ((decoratee: any, ...args: any[]) => any);
  inject?: Array<ProviderToken | WrapperDef>;
}

// TODO: At the moment method inejction isn't supported - think about supporting it
export const Decorate = createWrapper((decorator: Type | DecorateOptions): WrapperDef => {
  let token: Type, factory: ((decoratee: any, ...args: any[]) => any), deps: InjectionArgument[];

  if (typeof (decorator as DecorateOptions).decorator === 'function') { // function based decorator
    factory = (decorator as DecorateOptions).decorator;
    deps = InjectorMetadata.convertDependencies((decorator as DecorateOptions).inject || [], factory);
  } else { // class based decorator
    token = decorator as Type;
  }

  // console.log('decorate');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside decorate');

    // think about copy session
    const decoratee = next(injector, session);

    // class based decorator
    if (token) {
      const decoratedToken = session.options.token;
      const providerDef = getProviderDef(decorator);
      const args = providerDef.args;

      const ctorDeps: InjectionArgument[] = [];
      for (let i = 0, l = args.ctor.length; i < l; i++) {
        const arg = args.ctor[i];
        ctorDeps[i] = arg.token === decoratedToken ? { token: decoratedToken, options: { token: decoratedToken, useWrapper: Skip(decoratee) }, meta: {} } : arg;
      }
      const propsDeps: { [key: string]: InjectionArgument } = {};
      for (const name in args.props) {
        const prop = args.props[name];
        propsDeps[name] = prop.token === decoratedToken ? { token: decoratedToken, options: { token: decoratedToken, useWrapper: Skip(decoratee) }, meta: {} } : prop;
      }
      
      return InjectorResolver.createFactory(token, providerDef, ctorDeps, propsDeps)(injector, session);
    }

    // function based decorator
    return factory(decoratee, ...InjectorResolver.injectDeps(deps, injector, session));
  }
});

export const Memo = createWrapper((_: never): WrapperDef => {
  // console.log('memo');
  let value: any, init = false;
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside memo');
    if (init === false) {
      value = next(injector, session);
      session['$$sideEffects'] = false;
      init = true;
    }
    return value;
  }
});

export const SideEffects = createWrapper((_: never): WrapperDef => {
  // console.log('side effects');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside side effects');
    const value = next(injector, session);
    session['$$sideEffects'] = true;
    return value;
  }
});
