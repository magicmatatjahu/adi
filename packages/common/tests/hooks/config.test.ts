import { Injector, Injectable, Inject } from "@adi/core";

import { Config } from "../../src/hooks/config";

describe('Config injection hook', function () {
  test('should work as self token', function () {
    const config = {};

    @Injectable({
      annotations: {
        config,
      }
    })
    class Service {
      constructor(
        @Inject(Config()) readonly config: any,
      ) {}
    }

    const injector = Injector.create([
      Service,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.config).toEqual(config);
  });

  test('should work as self token but with provider token as config', function () {
    @Injectable({
      annotations: {
        config: 'config-token',
      }
    })
    class Service {
      constructor(
        @Inject(Config()) readonly config: any,
      ) {}
    }

    const injector = Injector.create([
      Service,
      {
        provide: 'config-token',
        useValue: 'some-config',
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.config).toEqual('some-config');
  });

  test('should work with another token', function () {
    const config = {};

    @Injectable()
    class Service {
      constructor(
        @Inject(Config('token')) readonly config: any,
      ) {}
    }

    const injector = Injector.create([
      Service,
      {
        provide: 'token',
        useValue: 'some-config',
        annotations: {
          config,
        }
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.config).toEqual(config);
  });

    test('should work with another token but with provider token as config', function () {
    const config = {};

    @Injectable()
    class Service {
      constructor(
        @Inject(Config('token')) readonly config: any,
      ) {}
    }

    const injector = Injector.create([
      Service,
      {
        provide: 'token',
        useValue: 'some-config',
        annotations: {
          config: 'config-token',
        }
      },
      {
        provide: 'config-token',
        useValue: 'some-config',
      }
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service).toBeInstanceOf(Service);
    expect(service.config).toEqual('some-config');
  });
});
