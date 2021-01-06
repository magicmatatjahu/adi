import { Scope } from "@adi/core";
import { ProviderDef, ModuleDef, Type, FactoryDef, ProviderDefArguments, InjectionArgument, ConstructorArguments, PropertiesArguments, MethodsArguments } from "@adi/core/dist/src/di/interfaces";
import { DEFINITIONS } from "@adi/core/dist/src/di/constants";

export class Introspector {
  getModuleDef(type: Type): ModuleDef {
    return type[DEFINITIONS.MODULE];
  }

  getComponentDef(type: Type): ProviderDef {
    return type[DEFINITIONS.COMPONENT];
  }

  getProviderDef(type: Type): ProviderDef {
    return type[DEFINITIONS.PROVIDER];
  }

  getFactory<T>(def: ProviderDef): FactoryDef<T> {
    return def.factory;
  }

  getScope(def: ProviderDef): Scope | undefined {
    return def.scope;
  }

  getProvidedIn(def: ProviderDef): string | symbol | Type | undefined {
    return def.providedIn;
  }

  getArguments<T>(def: ProviderDef): ProviderDefArguments | undefined {
    return def.args;
  }

  getConstructorArguments<T>(def: ProviderDef): ConstructorArguments {
    return def.args.ctor;
  }

  getPropertiesArguments<T>(def: ProviderDef): PropertiesArguments {
    return def.args.props;
  }

  getMethodsArguments<T>(def: ProviderDef): MethodsArguments {
    return def.args.methods;
  }

  static _$prov: ProviderDef = {
    token: Introspector,
    factory: () => new Introspector(),
    scope: Scope.SINGLETON,
    providedIn: "core",
  }
}
