import { Injector, Injectable, Inject, NewInquirer } from "../../src";

describe('Inquirer wrapper', function () {
  test('should inject inquirer in class provider', function () {
    @Injectable()
    class TestService {
      constructor(
        @Inject(NewInquirer()) readonly inquirer: typeof Service,
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
    ]);

    const service = injector.newGet(Service);
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

    const injector = new Injector([
      Service,
      {
        provide: 'test',
        useFactory(inquirer: Service) { return { inquirer } },
        inject: [NewInquirer()],
      },
    ]);

    const service = injector.newGet(Service);
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

    const injector = new Injector([
      Service,
      {
        provide: 'test',
        async useFactory(inquirer: Service) { return { inquirer } },
        inject: [NewInquirer()],
      },
    ]);

    const service = await injector.newGetAsync(Service);
    expect(service.service.inquirer).toBeInstanceOf(Service);
    expect(service.service.inquirer).toEqual(service);
  });
});