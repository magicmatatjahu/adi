import { Injector } from "./injector";
import { Session } from "./session";
import { InjectionArgument, FactoryDef, ProviderDef, Type } from "../interfaces";

export const InjectorResolver = new class {
  injectDeps(deps: Array<InjectionArgument>, injector: Injector, session: Session): Array<any> {
    const args: Array<any> = [];
    for (let i = 0, l = deps.length; i < l; i++) {
      const arg = deps[i];
      args.push(injector.privateGet(arg.token, arg.wrapper, arg.metadata, session));
    };
    return args;
  }

  injectProperties<T>(instance: T, props: Record<string, InjectionArgument>, injector: Injector, session?: Session): void {
    for (const name in props) {
      const prop = props[name];
      instance[name] = injector.privateGet(prop.token, prop.wrapper, prop.metadata, session);
    }
    // inject symbols
    for (const sb of Object.getOwnPropertySymbols(props)) {
      const prop = props[sb as any as string];
      instance[sb] = injector.privateGet(prop.token, prop.wrapper, prop.metadata, session);
    }
  }

  injectMethods<T>(instance: T, methods: Record<string, InjectionArgument[]>, injector: Injector, session?: Session): void {
    for (const name in methods) {
      const methodDeps = methods[name];
      const originalMethod = instance[name];

      instance[name] = (...args: any) => {
        let methodProp: InjectionArgument = undefined;
        for (let i = 0, l = methodDeps.length; i < l; i++) {
          if (args[i] === undefined && (methodProp = methodDeps[i]) !== undefined) {
            args[i] = injector.privateGet(methodProp.token, methodProp.wrapper, methodProp.metadata, session);
          }
        }
        return originalMethod.apply(instance, args);
      }
    }
  }

  createFactory<T>(
    provider: Type<T>, 
    def: ProviderDef, 
  ): FactoryDef<T> {
    const args = def.args;
    const deps = args.ctor,
      props = args.props,
      methods = args.methods;
    
    return (injector: Injector, session: Session) => {
      const instance = new provider(...this.injectDeps(deps, injector, session));
      this.injectProperties(instance, props, injector, session);
      this.injectMethods(instance, methods, injector, session);
      return instance;
    }
  }
}
