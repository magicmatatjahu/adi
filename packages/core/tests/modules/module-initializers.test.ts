import { Inject, Injectable, Injector, Module, ANNOTATIONS, MODULE_INITIALIZERS } from "../../src";

describe('MODULE_INITIALIZERS provider', function() {
  test('should works with single provider', async function() {
    let foobar: string = '';

    @Module({ 
      providers: [
        {
          provide: 'foobar',
          useValue: 'foobar',
        },
        {
          provide: MODULE_INITIALIZERS,
          useFactory: async (value: string) => {
            foobar = value;
          },
          inject: ['foobar'],
        },
      ],
    })
    class RootModule {}

    await new Injector(RootModule).buildAsync();
    expect(foobar).toEqual('foobar');
  });

  test('should works with multiple providers', async function() {
    let timesCalled: number = 0;

    @Module({ 
      providers: [
        {
          provide: 'foobar',
          useValue: 'foobar',
        },
        {
          provide: MODULE_INITIALIZERS,
          useFactory: async (value: string) => {
            if (value === 'foobar') {
              timesCalled++;
            }
          },
          inject: ['foobar'],
        },
        {
          provide: MODULE_INITIALIZERS,
          useFactory: (value: string) => {
            if (value === 'foobar') {
              timesCalled++;
            }
          },
          inject: ['foobar'],
        },
        {
          provide: MODULE_INITIALIZERS,
          useFactory: async (value: string) => {
            if (value === 'foobar') {
              timesCalled++;
            }
          },
          inject: ['foobar'],
        },
      ],
    })
    class RootModule {}

    await new Injector(RootModule).buildAsync();
    expect(timesCalled).toEqual(3);
  });

  test('should works with useExisting provider', async function() {
    let foobar: string = '';
    let calledTimes: number = 0;
    let eagerService;

    @Injectable()
    class Service {
      constructor(
        @Inject('foobar') fooBar: string,
      ) {
        foobar = fooBar;
        calledTimes++;
        eagerService = this;
      }
    }

    @Module({ 
      providers: [
        Service,
        {
          provide: 'foobar',
          useValue: 'foobar',
        },
        {
          provide: MODULE_INITIALIZERS,
          useExisting: Service,
        },
        {
          provide: MODULE_INITIALIZERS,
          useExisting: Service,
        },
        {
          provide: MODULE_INITIALIZERS,
          useExisting: Service,
        },
      ],
    })
    class RootModule {}

    const injector = await new Injector(RootModule).buildAsync();
    expect(foobar).toEqual('foobar');
    expect(calledTimes).toEqual(1);
    expect(eagerService === injector.get(Service)).toEqual(true);
  });

  test('should provisions the provider with the `@adi/eager=true` annotation', async function() {
    let foobar: string = '';
    let calledTimes: number = 0;
    let eagerService;

    @Injectable({
      annotations: {
        [ANNOTATIONS.EAGER]: true,
      }
    })
    class Service {
      constructor(
        @Inject('foobar') fooBar: string,
      ) {
        foobar = fooBar;
        calledTimes++;
        eagerService = this;
      }
    }

    @Module({ 
      providers: [
        Service,
        {
          provide: 'foobar',
          useValue: 'foobar',
        },
      ],
    })
    class RootModule {}

    const injector = await new Injector(RootModule).buildAsync();
    expect(foobar).toEqual('foobar');
    expect(calledTimes).toEqual(1);
    expect(eagerService).toBeInstanceOf(Service);
    expect(eagerService === injector.get(Service)).toEqual(true);
  });

  test('should properly run in sync mode', function() {
    let timesCalled: number = 0;

    @Module({ 
      providers: [
        {
          provide: 'foobar',
          useValue: 'foobar',
        },
        {
          provide: MODULE_INITIALIZERS,
          useFactory: (value: string) => {
            if (value === 'foobar') {
              timesCalled++;
            }
          },
          inject: ['foobar'],
        },
        {
          provide: MODULE_INITIALIZERS,
          useFactory: (value: string) => {
            if (value === 'foobar') {
              timesCalled++;
            }
          },
          inject: ['foobar'],
        },
        {
          provide: MODULE_INITIALIZERS,
          useFactory: (value: string) => {
            if (value === 'foobar') {
              timesCalled++;
            }
          },
          inject: ['foobar'],
        },
      ],
    })
    class RootModule {}

    Injector.create(RootModule).build();
    expect(timesCalled).toEqual(3);
  });

  // test('should properly run with proto injector', function() {
  //   let timesCalled: number = 0;

  //   @Module({ 
  //     providers: [
  //       {
  //         provide: 'foobar',
  //         useValue: 'foobar',
  //       },
  //       {
  //         provide: MODULE_INITIALIZERS,
  //         useFactory: (value: string) => {
  //           if (value === 'foobar') {
  //             timesCalled++;
  //           }
  //         },
  //         inject: ['foobar'],
  //       },
  //       {
  //         provide: MODULE_INITIALIZERS,
  //         useFactory: (value: string) => {
  //           if (value === 'foobar') {
  //             timesCalled++;
  //           }
  //         },
  //         inject: ['foobar'],
  //       },
  //       {
  //         provide: MODULE_INITIALIZERS,
  //         useFactory: (value: string) => {
  //           if (value === 'foobar') {
  //             timesCalled++;
  //           }
  //         },
  //         inject: ['foobar'],
  //       },
  //     ],
  //   })
  //   class RootModule {}

  //   const injector = Injector.createProto(RootModule).build();

  //   injector.fork();
  //   expect(timesCalled).toEqual(3);

  //   injector.fork();
  //   expect(timesCalled).toEqual(6);

  //   injector.fork();
  //   expect(timesCalled).toEqual(9);
  // });
});