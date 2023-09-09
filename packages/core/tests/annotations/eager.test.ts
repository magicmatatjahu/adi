import { Injector, Inject, Injectable, Module } from "../../src";

describe('eager annotation', function() {
  test('should not provisions the provider with not defined "eager" annotation', async function() {
    let foobar: string | undefined;
    let calledTimes: number = 0;
    let eagerService: Service | undefined;

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
      ],
    })
    class RootModule {}

    Injector.create(RootModule);
    expect(calledTimes).toEqual(0);
    expect(foobar).toBeUndefined();
    expect(eagerService).toBeUndefined();
  });

  test('should provisions the provider with the "eager=true" annotation', async function() {
    let foobar: string | undefined;
    let calledTimes: number = 0;
    let eagerService: Service | undefined;

    @Injectable({
      annotations: {
        eager: true,
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

    const injector = Injector.create(RootModule)
    expect(calledTimes).toEqual(1);
    expect(foobar).toEqual('foobar');
    expect(eagerService).toBeInstanceOf(Service);
    expect(eagerService === injector.get(Service)).toEqual(true);
  });

  test('should not provisions the provider with the "eager=false" annotation', async function() {
    let foobar: string | undefined;
    let calledTimes: number = 0;
    let eagerService: Service | undefined;

    @Injectable({
      annotations: {
        eager: false,
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

    Injector.create(RootModule);
    expect(calledTimes).toEqual(0);
    expect(foobar).toBeUndefined();
    expect(eagerService).toBeUndefined();
  });
});
