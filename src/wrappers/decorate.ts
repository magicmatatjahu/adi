import { getProviderDef } from "../decorators";
import { InjectorMetadata, InjectorResolver } from "../injector";
import { InjectionArgument, Type, WrapperDef } from "../interfaces";
import { Token } from "../types";
import { createWrapper } from "../utils";

import { Skip } from './skip';

interface DecorateOptions {
  decorator: ((decoratee: any, ...args: any[]) => any);
  inject?: Array<Token | WrapperDef>;
}

function transiteConstructorDeps(token: Token, value: any, ctorDeps: InjectionArgument[]): InjectionArgument[] {
  const newCtor: InjectionArgument[] = [];
  for (let i = 0, l = ctorDeps.length; i < l; i++) {
    const arg = ctorDeps[i];
    newCtor[i] = arg.token === token ? { token, options: { ...arg.options, token, useWrapper: Skip(value) }, metadata: arg.metadata } : arg;
  }
  return newCtor;
}

function transitePropertyDeps(token: Token, value: any, props: Record<string | symbol, InjectionArgument>): Record<string | symbol, InjectionArgument> {
  const newProps: Record<string | symbol, InjectionArgument> = {};
  for (const name in props) {
    const prop = props[name];
    newProps[name] = prop.token === token ? { token, options: {  ...prop.options, token, useWrapper: Skip(value) }, metadata: prop.metadata } : prop;
  }
  // inject symbols
  for (const sb of Object.getOwnPropertySymbols(props)) {
    const prop = props[sb as any as string];
    newProps[sb as any] = prop.token === token ? { token, options: {  ...prop.options, token, useWrapper: Skip(value) }, metadata: prop.metadata } : prop;
  }
  return newProps;
}

// TODO: At the moment method injection isn't supported - think about supporting it
function wrapper(decorator: Type | DecorateOptions): WrapperDef {
  let token: Type, factory: ((decoratee: any, ...args: any[]) => any), deps: InjectionArgument[];

  if (typeof (decorator as DecorateOptions).decorator === 'function') { // function based decorator
    factory = (decorator as DecorateOptions).decorator;
    deps = InjectorMetadata.convertDependencies((decorator as DecorateOptions).inject || [], factory);
  } else { // type based decorator
    token = decorator as Type;
  }

  return (injector, session, next) => {
    const decoratee = next(injector, session);

    // function based decorator
    if (token === undefined) {
      return factory(decoratee, ...InjectorResolver.injectDeps(deps, injector, session));
    }

    // class based decorator
    const decoratedToken = session.getToken();
    const providerDef = getProviderDef(decorator);
    const args = providerDef.args;
    
    return InjectorResolver.createFactory(
      token, 
      providerDef, 
      transiteConstructorDeps(decoratedToken, decoratee, args.ctor), 
      transitePropertyDeps(decoratedToken, decoratee, args.props), 
    )(injector, session);
  }
}

export const Decorate = createWrapper(wrapper);
