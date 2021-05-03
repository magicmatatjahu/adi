import { Injector } from "./injector";
import { InjectionArgument, InjectionSession, FactoryDef, ProviderDef, Type } from "../interfaces";
import { resolveRef } from "../utils";

export const InjectorResolver = new class {
  injectDeps(deps: Array<InjectionArgument | any>, injector: Injector, session: InjectionSession): Array<any> {
    const args: Array<any> = [];
    for (let i = 0, l = deps.length; i < l; i++) {
      const arg = deps[i];
      args.push(injector.get(resolveRef(arg.token), arg.options, session));
    };
    return args;
  }

  providerFactory<T>(provider: Type<T>, def: ProviderDef, ctorDeps?: Array<InjectionArgument>): FactoryDef<T> {
    const deps = ctorDeps || def.args.ctor,
      props = def.args.props,
      methods = def.args.methods;
    
    return (injector: Injector, session?: InjectionSession) => {
      const instance = new provider(...this.injectDeps(deps, injector, session));
      return instance;
    }
  }
}
