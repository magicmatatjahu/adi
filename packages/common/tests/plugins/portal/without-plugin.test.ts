import { Injector, Injectable, Inject, TransientScope } from "@adi/core";

import { Portal } from "../../../src/hooks/portal";

describe('Without portal plugin', function () {
  test('should not work', function () {
    @Injectable({
      scope: TransientScope,
    })
    class TestService {
      constructor(
        @Inject('foobar') readonly foobar: string,
      ) {}
    }

    @Injectable()
    class Service {
      constructor(
        readonly service: TestService,
        @Inject(Portal()) readonly portalService: TestService,
      ) {}
    }

    const parentInjector = Injector.create([
      TestService,
      {
        provide: 'foobar',
        useValue: 'parent foobar',
      }
    ])
    const childInjector = Injector.create([
      Service,
      {
        provide: 'foobar',
        useValue: 'child foobar',
      }
    ], parentInjector)

    const service = childInjector.getSync(Service);
    expect(service.service).toBeInstanceOf(TestService);
    expect(service.portalService).toBeInstanceOf(TestService);
    expect(service.service === service.portalService).toEqual(false);
    expect(service.service.foobar).toEqual('parent foobar');
    expect(service.portalService.foobar).toEqual('parent foobar');
  });
});
