import { Injector, Injectable, Inject, NewNamed, when } from "../../src";

describe('Named wrapper', function () {
  test('should inject named provider', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
        @Inject(NewNamed('namedService')) readonly namedService: TestService,
        @Inject(NewNamed('anotherService')) readonly anotherService: TestService,
      ) {}
    }

    const injector = new Injector([
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
    ]);

    const service = injector.newGet(Service);
    expect(service.service).toBeInstanceOf(TestService);
    expect((service.namedService) as any).toEqual('foobar');
    expect((service.anotherService) as any).toEqual('barfoo');
  });
});