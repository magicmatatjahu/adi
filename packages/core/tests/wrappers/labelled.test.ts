import { Injector, Injectable, Inject, NewLabelled, when } from "../../src";

describe('Labelled wrapper', function () {
  test('should inject labeled provider', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
        @Inject(NewLabelled({ foo: 'bar' })) readonly foobar: TestService,
        @Inject(NewLabelled({ bar: 'foo' })) readonly barfoo: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
      {
        provide: TestService,
        useValue: 'foobar',
        when: when.labelled({ foo: 'bar' }),
      },
      {
        provide: TestService,
        useValue: 'barfoo',
        when: when.labelled({ bar: 'foo' }),
      },
    ]);

    const service = injector.newGet(Service);
    expect(service.service).toBeInstanceOf(TestService);
    expect((service.foobar) as any).toEqual('foobar');
    expect((service.barfoo) as any).toEqual('barfoo');
  });
});