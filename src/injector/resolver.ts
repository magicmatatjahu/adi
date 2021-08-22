import { Injector } from "./injector";
import { Session } from "./session";
import { InjectionArgument, FactoryDef, ProviderDef, Type, InstanceRecord } from "../interfaces";
import { InjectionStatus } from "../enums";
import { Wrapper } from "../utils";
import { Token } from "../types";
import { InjectorMetadata } from "./metadata";

export const InjectorResolver = new class {
  injectDeps(deps: Array<InjectionArgument>, injector: Injector, session: Session): Array<any> {
    const args: Array<any> = [];
    for (let i = 0, l = deps.length; i < l; i++) {
      const arg = deps[i];
      args.push(injector.privateGet(arg.token, arg.wrapper, arg.metadata, session));
    };
    return args;
  }

  async injectDepsAsync(deps: Array<InjectionArgument>, injector: Injector, session: Session): Promise<Array<any>> {
    const args: Array<any> = [];
    for (let i = 0, l = deps.length; i < l; i++) {
      const arg = deps[i];
      args.push(await injector.privateGet(arg.token, arg.wrapper, arg.metadata, session));
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

  async injectPropertiesAsync<T>(instance: T, props: Record<string, InjectionArgument>, injector: Injector, session?: Session): Promise<void> {
    for (const name in props) {
      const prop = props[name];
      instance[name] = await injector.privateGet(prop.token, prop.wrapper, prop.metadata, session);
    }
    // inject symbols
    for (const sb of Object.getOwnPropertySymbols(props)) {
      const prop = props[sb as any as string];
      instance[sb] = await injector.privateGet(prop.token, prop.wrapper, prop.metadata, session);
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

  createProviderFactory<T>(
    provider: Type<T>, 
    def: ProviderDef, 
  ): FactoryDef<T> {
    const args = def.args;
    const parameters = args.parameters,
      properties = args.properties,
      methods = args.methods;
    
    return (injector: Injector, session: Session) => {
      // console.log('lol')
      if (session.isAsync() === true) {
        return this.providerFactoryAsync(provider, parameters, properties, methods, injector, session);
      }
      const instance = new provider(...this.injectDeps(parameters, injector, session));
      this.injectProperties(instance, properties, injector, session);
      this.injectMethods(instance, methods, injector, session);
      return instance;
    }
  }

  async providerFactoryAsync<T>(
    provider: Type<T>,
    parameters: Array<InjectionArgument>,
    properties: Record<string, InjectionArgument>,
    methods: Record<string, InjectionArgument[]>,
    injector: Injector,
    session: Session,
  ) {
    const instance = new provider(...await this.injectDepsAsync(parameters, injector, session));
    await this.injectPropertiesAsync(instance, properties, injector, session);
    this.injectMethods(instance, methods, injector, session);
    return instance;
  }

  createFactory(
    factory: Function,
    deps: Array<Token | Wrapper>,
  ) {
    const convertedDeps = InjectorMetadata.convertDependencies(deps, factory);
    return (injector: Injector, session: Session) => {
      if (session.isAsync() === true) {
        return this.injectDepsAsync(convertedDeps, injector, session).then(args => factory(...args));
      }
      return factory(...this.injectDeps(convertedDeps, injector, session));
    }
  }

  handleCircularRefs(instance: InstanceRecord, session: Session): any {
    if (instance.status & InjectionStatus.CIRCULAR) {
      return instance.value;
    }
    
    const proto = instance.def.proto;
    if (!proto) {
      throw new Error("Circular Dependency");
    }
    (instance as InstanceRecord).status |= InjectionStatus.CIRCULAR;
    // add flag that resolution session has circular reference. 
    // `OnInitHook` wrapper will handle later this flag to run `onInit` hook in proper order 
    instance.value = Object.create(proto);
    session.parent['$$circular'] = session.parent['$$circular'] || true;
    session.parent['$$startCircular'] = instance.value;
    return instance.value;
  }
}
