import { Injector, Injectable, Module, Scope, OnInit } from "../../src";

// function createProtoInjectorClass() {
//   return class ProtoInjector extends Injector {
//     static create(
//       injector: Type<any> | ModuleMetadata | Array<Provider> = [],
//       parent: Injector = NilInjector,
//       options?: InjectorOptions,
//     ): ProtoInjector {
//       return new ProtoInjector(injector, parent, options);
//     }
  
//     private stack: Injector[] = [];
  
//     build(): ProtoInjector {
//       if (this.status & InjectorStatus.BUILDED) return; 
//       this.status |= InjectorStatus.BUILDED;
  
//       if (Array.isArray(this.metatype)) return;
//       this.stack = build(this, true);
//       return this;
//     }
  
//     async buildAsync(): Promise<ProtoInjector> {
//       if (this.status & InjectorStatus.BUILDED) return; 
//       this.status |= InjectorStatus.BUILDED;
  
//       if (Array.isArray(this.metatype)) return;
//       this.stack = await buildAsync(this, true);
//       return this;
//     }
  
//     fork(parent?: Injector): Injector {
//       // Map<old Injector, new Injector>
//       const injectorMap = new Map<Injector, Injector>();
//       const newInjector = this.cloneInjector(this, injectorMap);
//       if (parent) (newInjector as any).parent = parent;
  
//       const newStack = this.stack.map(oldInjector => injectorMap.get(oldInjector));
//       initModules(newStack);
//       return newInjector;
//     }
  
//     async forkAsync(parent?: Injector): Promise<Injector> {
//       // Map<old Injector, new Injector>
//       const injectorMap = new Map<Injector, Injector>();
//       const newInjector = this.cloneInjector(this, injectorMap);
//       if (parent) (newInjector as any).parent = parent;
  
//       const newStack = this.stack.map(oldInjector => injectorMap.get(oldInjector));
//       await initModulesAsync(newStack);
//       return newInjector;
//     }
  
//     private cloneInjector(oldInjector: Injector, injectorMap: Map<Injector, Injector>): Injector {
//       const newInjector = Object.assign(Object.create(Injector.prototype) as Injector, oldInjector);
//       injectorMap.set(oldInjector, newInjector);
  
//       // create copy of the existing injectors in the subgraph
//       const newImports = new Map<Type, Injector | Map<ModuleID, Injector>>();
//       oldInjector.imports.forEach((injector, type) => {
//         const newMap = new Map<ModuleID, Injector>();
//         newImports.set(type, newMap);
//         injector.forEach((injectorWithID, id) => {
//           newMap.set(id, this.cloneInjector(injectorWithID, injectorMap));
//         });
//       });
  
//       // copy components
//       newInjector.components = new Map();
//       oldInjector.components.forEach((component, token) => newInjector.components.set(token, this.cloneProviderRecord(component, newInjector)));
      
//       // copy records
//       newInjector.records = new Map();
//       oldInjector.records.forEach((provider, token) => newInjector.records.set(token, this.cloneProviderRecord(provider, newInjector)));
  
//       // copy new imported records
//       newInjector.importedRecords = new Map();
//       oldInjector.importedRecords.forEach((collections, token) => newInjector.importedRecords.set(token, collections.map(provider => injectorMap.get(provider.host).records.get(token))));
  
//       return newInjector;
//     }
  
//     private cloneProviderRecord(provider: ProviderRecord, newInjector: Injector): ProviderRecord {
//       const newProvider = new ProviderRecord(provider.token, newInjector, provider.isComponent);
//       newProvider.defs = provider.defs.map(def => ({ ...def, record: newProvider, values: new Map() }));
//       newProvider.constraintDefs = provider.constraintDefs.map(def => ({ ...def, record: newProvider, values: new Map() }));
//       newProvider.wrappers = provider.wrappers.map(wrapper => ({ ...wrapper }));
//       return newProvider;
//     }
//   }
// }

describe.skip('ProtoInjector', function() {
  test('', () => {});

  // test('should properly copy simple dependency graph', function() {
  //   @Injectable({
  //     scope: Scope.SINGLETON,
  //   })
  //   class Singleton {}

  //   @Injectable({
  //     scope: Scope.TRANSIENT,
  //   })
  //   class Transient {}

  //   @Module({
  //     providers: [
  //       Singleton,
  //       Transient
  //     ]
  //   })
  //   class MainModule {}

  //   const injector = Injector.createProto(MainModule).build();
    
  //   const newInjector1 = injector.fork();
  //   const singleton1 = newInjector1.get(Singleton);
  //   const transient1 = newInjector1.get(Transient);
  //   expect(singleton1).toBeInstanceOf(Singleton);
  //   expect(transient1).toBeInstanceOf(Transient);

  //   const newInjector2 = injector.fork();
  //   const singleton2 = newInjector2.get(Singleton);
  //   const transient2 = newInjector2.get(Transient);
  //   expect(singleton2).toBeInstanceOf(Singleton);
  //   expect(transient2).toBeInstanceOf(Transient);

  //   expect(singleton1 === singleton2).toEqual(false);
  //   expect(transient1 === transient2).toEqual(false);
  // });

  // test('should properly copy deep dependency graph', function() {
  //   @Injectable({
  //     scope: Scope.SINGLETON,
  //   })
  //   class Service {}

  //   @Injectable({
  //     scope: Scope.SINGLETON,
  //   })
  //   class ChildService {}

  //   @Module({
  //     providers: [
  //       ChildService
  //     ],
  //     exports: [
  //       ChildService,
  //     ]
  //   })
  //   class ChildModule {}

  //   @Module({
  //     imports: [
  //       ChildModule,
  //     ],
  //     providers: [
  //       Service,
  //     ]
  //   })
  //   class MainModule {}

  //   const injector = Injector.createProto(MainModule).build();
    
  //   const newInjector1 = injector.fork();
  //   const parentSingleton1 = newInjector1.get(Service);
  //   const childSingleton1 = newInjector1.get(ChildService);
  //   expect(parentSingleton1).toBeInstanceOf(Service);
  //   expect(childSingleton1).toBeInstanceOf(ChildService);

  //   const newInjector2 = injector.fork();
  //   const parentSingleton2 = newInjector2.get(Service);
  //   const childSingleton2 = newInjector2.get(ChildService);
  //   expect(parentSingleton2).toBeInstanceOf(Service);
  //   expect(childSingleton2).toBeInstanceOf(ChildService);

  //   expect(parentSingleton1 === parentSingleton2).toEqual(false);
  //   expect(childSingleton1 === childSingleton2).toEqual(false);
  // });

  // test('should properly copy deep graph with proxy modules', function() {
  //   /*
  //    *   B(proxy)
  //    *      |
  //    *  B   C
  //    *   \ /
  //    *   Main
  //    */

  //   @Injectable({
  //     scope: Scope.SINGLETON,
  //   })
  //   class ServiceB {}

  //   @Module()
  //   class ModuleB {}

  //   @Module({
  //     imports: [
  //       {
  //         module: ModuleB,
  //         providers: [ServiceB],
  //         exports: [ServiceB],
  //       }
  //     ],
  //     exports: [ModuleB],
  //   })
  //   class ModuleC {}

  //   @Module({ 
  //     imports: [ModuleB, ModuleC],
  //   })
  //   class MainModule {}

  //   const injector = Injector.createProto(MainModule).build();
    
  //   const newInjector1 = injector.fork();
  //   const service1 = newInjector1.get(ServiceB);
  //   expect(service1).toBeInstanceOf(ServiceB);

  //   const newInjector2 = injector.fork();
  //   const service2 = newInjector2.get(ServiceB);
  //   expect(service2).toBeInstanceOf(ServiceB);

  //   expect(service1 === service2).toEqual(false);
  // });

  // test('should copied graph init in proper order', function() {
  //   /*
  //    *  D
  //    *  |
  //    *  B C
  //    *   \|
  //    *   Main
  //    */

  //   const initOrder: string[] = [];

  //   @Module()
  //   class ModuleD implements OnInit {
  //     onInit() {
  //       initOrder.push('D');
  //     }
  //   }

  //   @Module()
  //   class ModuleC implements OnInit {
  //     onInit() {
  //       initOrder.push('C');
  //     }
  //   }

  //   @Module({ imports: [ModuleD] })
  //   class ModuleB implements OnInit {
  //     onInit() {
  //       initOrder.push('B');
  //     }
  //   }

  //   @Module({ imports: [ModuleB, ModuleC] })
  //   class MainModule implements OnInit {
  //     onInit() {
  //       initOrder.push('Main');
  //     }
  //   }

  //   const injector = Injector.createProto(MainModule).build();
    
  //   injector.fork();
  //   expect(initOrder).toEqual(['D', 'C', 'B', 'Main']);

  //   // fork again to check if order is this same
  //   injector.fork();
  //   expect(initOrder).toEqual(['D', 'C', 'B', 'Main', 'D', 'C', 'B', 'Main']);

  //   // and again
  //   injector.fork();
  //   expect(initOrder).toEqual(['D', 'C', 'B', 'Main', 'D', 'C', 'B', 'Main', 'D', 'C', 'B', 'Main']);
  // });
});
