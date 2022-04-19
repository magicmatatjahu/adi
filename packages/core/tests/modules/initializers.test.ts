import { Inject, Injectable, Injector, Module, INITIALIZERS } from "../../src";

describe('MODULE_INITIALIZERS provider', function() {
  test('should works with single provider', async function() {
    let foobar: string;

    @Module({ 
      providers: [
        {
          provide: 'foobar',
          useValue: 'foobar',
        },
        {
          provide: INITIALIZERS,
          useFactory: async (value: string) => {
            foobar = value;
          },
          inject: ['foobar'],
        },
      ],
    })
    class RootModule {}

    await new Injector(RootModule).init();
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
          provide: INITIALIZERS,
          useFactory: async (value: string) => {
            if (value === 'foobar') {
              timesCalled++;
            }
          },
          inject: ['foobar'],
        },
        {
          provide: INITIALIZERS,
          useFactory: (value: string) => {
            if (value === 'foobar') {
              timesCalled++;
            }
          },
          inject: ['foobar'],
        },
        {
          provide: INITIALIZERS,
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

    await new Injector(RootModule).init();
    expect(timesCalled).toEqual(3);
  });

  test('should works with useExisting provider', async function() {
    let foobar: string;
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
          provide: INITIALIZERS,
          useExisting: Service,
        },
        {
          provide: INITIALIZERS,
          useExisting: Service,
        },
        {
          provide: INITIALIZERS,
          useExisting: Service,
        },
      ],
    })
    class RootModule {}

    const injector = await new Injector(RootModule).init();
    expect(foobar).toEqual('foobar');
    expect(calledTimes).toEqual(1);
    expect(eagerService === injector.get(Service)).toEqual(true);
  });

  test('should provisions the provider with the `adi:eager=true` annotation', async function() {
    let foobar: string ;
    let calledTimes: number = 0;
    let eagerService;

    @Injectable({
      annotations: {
        'adi:eager': true,
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

    const injector = await new Injector(RootModule).init();
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
          provide: INITIALIZERS,
          useFactory: (value: string) => {
            if (value === 'foobar') {
              timesCalled++;
            }
          },
          inject: ['foobar'],
        },
        {
          provide: INITIALIZERS,
          useFactory: (value: string) => {
            if (value === 'foobar') {
              timesCalled++;
            }
          },
          inject: ['foobar'],
        },
        {
          provide: INITIALIZERS,
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

    Injector.create(RootModule).init();
    expect(timesCalled).toEqual(3);
  });
});
