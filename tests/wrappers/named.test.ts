import { Injector, Injectable, Inject, Named, c } from "../../src";

describe('Named wrapper', function () {
  test('should inject named provider', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
        @Inject(Named('namedService')) readonly namedService: TestService,
        @Inject(Named('anotherService')) readonly anotherService: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
      {
        provide: TestService,
        useValue: 'foobar',
        when: c.named('namedService'),
      },
      {
        provide: TestService,
        useValue: 'barfoo',
        when: c.named('anotherService'),
      },
    ]);

    const service = injector.get(Service) as Service;
    expect(service.service).toBeInstanceOf(TestService);
    expect((service.namedService) as any).toEqual('foobar');
    expect((service.anotherService) as any).toEqual('barfoo');
  });
});