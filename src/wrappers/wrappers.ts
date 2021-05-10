import { Context, Injector, NilInjector } from "../injector";
import { InjectionSession, NextWrapper, WrapperDef } from "../interfaces";
import { Scope } from "../scope";
import { Token as ProviderToken } from "../types";
import { createWrapper } from "../utils";
import { CONSTRAINTS } from "../constants";

export const Token = createWrapper((token: ProviderToken): WrapperDef => {
  // console.log('token');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside token');
    session.options = session.options || {} as any;
    session.options.token = token;
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

export const Optional = createWrapper((_: never): WrapperDef => {
  // console.log('optional');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside optional');
    try {
      return next(injector, session);
    } catch(err) {
      if ((err as any).NilInjectorError === true) return undefined;
      throw err;
    }
  }
});

// skip injection
export const Skip = createWrapper((_: never): WrapperDef => {
  // console.log('noinject');
  return () => {
    // console.log('inside noinject');
    return undefined;
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
    const ownRecord = (injector as any).records.get(token);

    while (parentInjector !== NilInjector) {
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
    // injector should have record
    const record = (injector as any).records.get(options.token);
    const defs = (injector as any).getDefinitions(record, session);
    // TODO: improve function to pass wrappers chain again and maybe copy of session
    // add also check for side effects
    return defs.map(def => (injector as any).resolveDef(def, options, session));
  }
});

interface DecorateOptions {
  decorator: ProviderToken; 
}

export const Decorate = createWrapper((decorator: ProviderToken | DecorateOptions): WrapperDef => {
  const token = (decorator as DecorateOptions).decorator || decorator;

  // console.log('decorate');
  return (injector: Injector, session: InjectionSession, next: NextWrapper) => {
    // console.log('inside decorate');

    const decoratee = next(injector, session);
    // only class for POC
    return new (decorator as any)(decoratee);
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