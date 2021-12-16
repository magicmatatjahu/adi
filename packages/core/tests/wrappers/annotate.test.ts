import { Injector, Injectable, Inject, Annotate, when } from "../../src";

describe('Annotate wrapper', function () {
  test('should inject labeled provider', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
        @Inject(Annotate({ foo: 'bar' })) readonly foobar: TestService,
        @Inject(Annotate({ bar: 'foo' })) readonly barfoo: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
      {
        provide: TestService,
        useValue: 'foobar',
        when: when.annotated({ foo: 'bar' }),
      },
      {
        provide: TestService,
        useValue: 'barfoo',
        when: when.annotated({ bar: 'foo' }),
      },
    ]);

    const service = injector.get(Service);
    expect(service.service).toBeInstanceOf(TestService);
    expect((service.foobar) as any).toEqual('foobar');
    expect((service.barfoo) as any).toEqual('barfoo');
  });
});