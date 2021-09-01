import { Injector, Injectable, Inject, Sync } from "../../src";

describe('Sync wrapper', function () {
  test('should inject given context', async function () {
    @Injectable()
    class TestService {
      constructor(
        @Inject('foobar') readonly foobar: string,
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        @Inject(Sync()) readonly service: TestService,
      ) {}
    }

    const injector = new Injector([
      Service,
      TestService,
      {
        provide: 'foobar',
        useFactory: async () => {
          return 'foobar'
        },
      }
    ]);

    const service = await injector.getAsync(Service);
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.service.foobar).toBeInstanceOf(Promise);
    expect(await service.service.foobar).toEqual('foobar');
  });
});
