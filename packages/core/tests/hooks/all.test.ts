import { Injector, Injectable, Inject, Module, All, Named, when, createHook } from "../../src";

describe('All injection hook', function () {
  test('should inject multi providers - provider based hook', function () {
    @Injectable()
    class MultiProvider extends Array<string> {}

    @Injectable()
    class Service {
      constructor(
        @Inject() readonly multi: MultiProvider,
      ) {}
    }

    const injector = Injector.create([
      Service,
      {
        provide: MultiProvider,
        hooks: [All()],
      },
      {
        provide: MultiProvider,
        useValue: 'multi-provider-1'
      },
      {
        provide: MultiProvider,
        useValue: 'multi-provider-2'
      },
      {
        provide: MultiProvider,
        useValue: 'multi-provider-3'
      },
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.multi).toEqual(['multi-provider-1', 'multi-provider-2', 'multi-provider-3']);
  });

  test('should inject multi providers - injection based hook', function () {
    @Injectable()
    class MultiProvider extends Array<string> {}

    @Injectable()
    class Service {
      constructor(
        @Inject([All()]) readonly multi: MultiProvider,
      ) {}
    }

    const injector = new Injector([
      Service,
      {
        provide: MultiProvider,
        useValue: 'multi-provider-1'
      },
      {
        provide: MultiProvider,
        useValue: 'multi-provider-2'
      },
      {
        provide: MultiProvider,
        useValue: 'multi-provider-3'
      },
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.multi).toEqual(['multi-provider-1', 'multi-provider-2', 'multi-provider-3']);
  });

  test('should inject multi providers from given token with constraints - provider based hook', function () {
    @Injectable()
    class MultiProvider extends Array<string> {}

    @Injectable()
    class Service {
      constructor(
        @Inject([Named('multi')]) readonly multi: MultiProvider,
      ) {}
    }

    const injector = Injector.create([
      Service,
      {
        provide: MultiProvider,
        hooks: [All()],
      },
      {
        provide: MultiProvider,
        useValue: 'multi1',
        when: when.named('multi'),
      },
      {
        provide: MultiProvider,
        useValue: 'multi2',
      },
      {
        provide: MultiProvider,
        useValue: 'multi3',
        when: when.named('multi'),
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.multi).toEqual(['multi1', 'multi3']);
  });

  test('should inject multi providers from given token with constraints - injection based hook', function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('token', [
          All(),
          Named('multi'),
        ])
        readonly multi: Array<string>,
      ) {}
    }

    const injector = Injector.create([
      Service,
      {
        provide: 'token',
        useValue: 'no-multi'
      },
      {
        provide: 'token',
        useValue: 'multi1',
        when: when.named('multi'),
      },
      {
        provide: 'token',
        useValue: 'multi2',
        when: when.named('multi'),
      },
      {
        provide: 'token',
        useValue: 'multi3',
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.multi).toEqual(['multi1', 'multi2']);
  });

  test('should inject multi providers from given token with proper order', function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('token', [All()]) readonly multi: Array<string>,
      ) {}
    }

    const injector = Injector.create([
      Service,
      {
        provide: 'token',
        useValue: 'multi1',
        annotations: {
          'adi:order': 3,
        }
      },
      {
        provide: 'token',
        useValue: 'multi2',
        annotations: {
          'adi:order': 4,
        }
      },
      {
        provide: 'token',
        useValue: 'multi3',
        annotations: {
          'adi:order': 1,
        }
      },
      {
        provide: 'token',
        useValue: 'multi4',
        annotations: {
          'adi:order': 2,
        }
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.multi).toEqual(['multi3', 'multi4', 'multi1', 'multi2']);
  });

  test('should inject multi providers from given token - async resolution case', async function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('token', [All()]) readonly multi: Array<string>,
      ) {}
    }

    const injector = Injector.create([
      Service,
      {
        provide: 'token',
        async useFactory() {
          return 'multi1';
        }
      },
      {
        provide: 'token',
        async useFactory() {
          return 'multi2';
        }
      },
      {
        provide: 'token',
        async useFactory() {
          return 'multi3';
        }
      }
    ]).init() as Injector;

    const service = await injector.get(Service);
    expect(service.multi).toEqual(['multi1', 'multi2', 'multi3']);
  });

  test('should inject multi providers from given token with hooks on definitions', function () {
    const INFINITY = 1 / 0;
    function toKey(value: any) {
      const typeOf = typeof value;
      if (typeOf === 'string' || typeOf === 'symbol') {
        return value;
      }
      const result = `${value}`;
      return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
    }
    
    function getValue(value: object, path: string[]) {
      let index = 0
      const length = path.length
    
      while (value != null && index < length) {
        value = value[toKey(path[index++])];
      }
      return (index && index == length) ? value : undefined;
    }
    
    const Path = createHook((path: string) => {
      const props = path.split('.').filter(Boolean);
      
      return (session, next) => {    
        const value = next(session);
        return getValue(value, props);
      }
    });

    @Injectable()
    class Service {
      constructor(
        @Inject('token', [All()]) readonly multi: Array<string>,
      ) {}
    }

    const injector = Injector.create([
      Service,
      {
        provide: 'token',
        useValue: {
          a: {
            b: 'multi1',
          },
        },
        hooks: [Path('a.b')],
      },
      {
        provide: 'token',
        useValue: {
          b: {
            c: 'multi2',
          },
        },
        hooks: [Path('b.c')],
      },
      {
        provide: 'token',
        useValue: {
          c: {
            d: 'multi3',
          },
        },
        hooks: [Path('c.d')],
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.multi.length).toEqual(3);
    expect(service.multi[0]).toEqual('multi1');
    expect(service.multi[1]).toEqual('multi2');
    expect(service.multi[2]).toEqual('multi3');
  });

  // test('should inject multi providers from imported modules', function () {
  //   @Injectable()
  //   class Service {
  //     constructor(
  //       @Inject('token', All()) readonly multi: Array<string>,
  //     ) {}
  //   }

  //   @Module({
  //     providers: [
  //       {
  //         provide: 'token',
  //         useValue: 'childMulti2-1',
  //       },
  //       {
  //         provide: 'token',
  //         useValue: 'childMulti2-2',
  //       },
  //       {
  //         provide: 'token',
  //         useValue: 'childMulti2-3',
  //       },
  //     ],
  //     exports: [
  //       'token',
  //     ]
  //   })
  //   class ChildModule2 {}

  //   @Module({
  //     providers: [
  //       {
  //         provide: 'token',
  //         useValue: 'childMulti1-1',
  //       },
  //       {
  //         provide: 'token',
  //         useValue: 'childMulti1-2',
  //       },
  //     ],
  //     exports: [
  //       'token',
  //     ]
  //   })
  //   class ChildModule1 {}

  //   @Module({
  //     imports: [
  //       ChildModule1,
  //       ChildModule2,
  //     ],
  //     providers: [
  //       Service,
  //       {
  //         provide: 'token',
  //         useValue: 'multi1',
  //       },
  //       {
  //         provide: 'token',
  //         useValue: 'multi2',
  //       },
  //       {
  //         provide: 'token',
  //         useValue: 'multi3',
  //       }
  //     ]
  //   })
  //   class MainModule {}

  //   const injector = Injector.create(MainModule).build();
  //   const service = injector.get(Service);
  //   expect(service.multi.length).toEqual(8);
  //   expect(service.multi).toEqual([
  //     'multi1',
  //     'multi2',
  //     'multi3',
  //     'childMulti1-1',
  //     'childMulti1-2',
  //     'childMulti2-1',
  //     'childMulti2-2',
  //     'childMulti2-3',
  //   ]);
  // });

  // test('should inject multi providers from imported modules with constraints', function () {
  //   @Injectable()
  //   class Service {
  //     constructor(
  //       @Inject('token', [
  //         All(),
  //         Named('multi'),
  //       ]) 
  //       readonly multi: Array<string>,
  //     ) {}
  //   }

  //   @Module({
  //     providers: [
  //       {
  //         provide: 'token',
  //         useValue: 'childMulti2-1',
  //       },
  //       {
  //         provide: 'token',
  //         useValue: 'childMulti2-2',
  //         when: when.named('multi'),
  //       },
  //       {
  //         provide: 'token',
  //         useValue: 'childMulti2-3',
  //       },
  //     ],
  //     exports: [
  //       'token',
  //     ]
  //   })
  //   class ChildModule2 {}

  //   @Module({
  //     providers: [
  //       {
  //         provide: 'token',
  //         useValue: 'childMulti1-1',
  //       },
  //       {
  //         provide: 'token',
  //         useValue: 'childMulti1-2',
  //         when: when.named('multi'),
  //       },
  //     ],
  //     exports: [
  //       'token',
  //     ]
  //   })
  //   class ChildModule1 {}

  //   @Module({
  //     imports: [
  //       ChildModule1,
  //       ChildModule2,
  //     ],
  //     providers: [
  //       Service,
  //       {
  //         provide: 'token',
  //         useValue: 'multi1',
  //         when: when.named('multi'),
  //       },
  //       {
  //         provide: 'token',
  //         useValue: 'multi2',
  //       },
  //       {
  //         provide: 'token',
  //         useValue: 'multi3',
  //         when: when.named('multi'),
  //       }
  //     ]
  //   })
  //   class MainModule {}

  //   const injector = Injector.create(MainModule).build();
  //   const service = injector.get(Service);
  //   expect(service.multi.length).toEqual(4);
  //   expect(service.multi).toEqual([
  //     'multi1',
  //     'multi3',
  //     'childMulti1-2',
  //     'childMulti2-2',
  //   ]);
  // });
});
