import { Injector, Injectable, Inject, Labelled, c } from "../../src";

describe('Labelled wrapper', function () {
  test('should inject labeled provider', function () {
    @Injectable()
    class TestService {}

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
        @Inject(Labelled({ foo: 'bar' })) readonly foobar: TestService,
        @Inject(Labelled({ bar: 'foo' })) readonly barfoo: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
      {
        provide: TestService,
        useValue: 'foobar',
        when: c.labelled({ foo: 'bar' }),
      },
      {
        provide: TestService,
        useValue: 'barfoo',
        when: c.labelled({ bar: 'foo' }),
      },
    ]);

    const service = injector.get(Service) as Service;
    expect(service.service).toBeInstanceOf(TestService);
    expect((service.foobar) as any).toEqual('foobar');
    expect((service.barfoo) as any).toEqual('barfoo');
  });
});