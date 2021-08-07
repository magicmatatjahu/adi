import { getProviderDef } from "../decorators";
import { InjectorMetadata, InjectorResolver } from "../injector";
import { InjectionArgument, Type, WrapperDef } from "../interfaces";
import { Token } from "../types";
import { createWrapper } from "../utils";

interface DecorateOptions {
  decorator: ((decoratee: any, ...args: any[]) => any);
  inject?: Array<Token | WrapperDef>;
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
    // think about copy session
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
      InjectorMetadata.transiteConstructorDeps(decoratedToken, decoratee, args.ctor), 
      InjectorMetadata.transitePropertyDeps(decoratedToken, decoratee, args.props), 
    )(injector, session);
  }
}

export const Decorate = createWrapper(wrapper);
