import { Injector, Inject, Injectable, Deps, Provider } from "../../src";

describe('Deps wrapper', function () {
  test('should works (injection based wrapper)', function () {

    @Injectable()
    class TestService {
      constructor(
        @Inject('foo') readonly foo: string,
        @Inject('bar') readonly bar: string,
      ) {}
    }

    const providers: Provider[] = [
      {
        provide: 'bar',
        useValue: 'transitional bar'
      },
    ]

    @Injectable()
    class Service {
      constructor(
        @Inject(Deps(providers)) readonly service1: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
      {
        provide: 'foo',
        useValue: 'normal foo',
      }
    ]);

    // const service = injector.get(Service) as Service;
    // expect(service.service1).toBeInstanceOf(TestService);
  });
});
