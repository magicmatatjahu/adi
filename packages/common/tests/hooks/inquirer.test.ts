import { Injector, Inject, Injectable } from "@adi/core";
import { Inquirer } from "../../src";

describe('Inquirer injection hook', function () {
  test('should inject inquirer in class provider', function () {
    @Injectable()
    class TestService {
      constructor(
        @Inject([Inquirer()]) readonly inquirer: typeof Service,
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
      ) {}
    }

    const injector = Injector.create([
      Service,
      TestService,
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.service.inquirer).toBeInstanceOf(Service);
    expect(service.service.inquirer).toEqual(service);
  });

  test('should inject inquirer in factory provider', function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('test') readonly service: any,
      ) {}
    }

    const injector = Injector.create([
      Service,
      {
        provide: 'test',
        useFactory(inquirer: Service) { return { inquirer } },
        inject: [[Inquirer()]],
      },
    ]).init() as Injector;

    const service = injector.get(Service) as Service;
    expect(service.service.inquirer).toBeInstanceOf(Service);
    expect(service.service.inquirer).toEqual(service);
  });

  test('should works in async/parallel injection', async function () {
    @Injectable()
    class Service {
      constructor(
        @Inject('test') readonly service: any,
      ) {}
    }

    const injector = Injector.create([
      Service,
      {
        provide: 'test',
        async useFactory(inquirer: Service) { return { inquirer } },
        inject: [[Inquirer()]],
      },
    ]).init() as Injector;

    const service = await injector.get(Service) as Service;
    expect(service.service.inquirer).toBeInstanceOf(Service);
    expect(service.service.inquirer).toEqual(service);
  });
});