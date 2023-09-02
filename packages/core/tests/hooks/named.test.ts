import { Injector, Injectable, Inject, Named, when } from "../../src";

describe('Named injection hook', function () {
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

    const injector = Injector.create([
      Service,
      TestService,
      {
        provide: TestService,
        useValue: 'foobar',
        when: when.named('namedService'),
      },
      {
        provide: TestService,
        useValue: 'barfoo',
        when: when.named('anotherService'),
      },
    ])

    const service = injector.getSync(Service);
    expect(service.service).toBeInstanceOf(TestService);
    expect((service.namedService) as any).toEqual('foobar');
    expect((service.anotherService) as any).toEqual('barfoo');
  });
});
