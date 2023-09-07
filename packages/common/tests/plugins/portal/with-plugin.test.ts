import { ADI, Injector, Injectable, Inject, TransientScope } from "@adi/core";

import { Portal } from "../../../src/hooks/portal";
import { portalPlugin } from "../../../src/plugins/portal.plugin";

describe('Portal plugin with Portal injection hook', function () {
  const plugin = portalPlugin();

  beforeAll(() => {
    ADI.use(plugin);
  });

  beforeAll(() => {
    ADI.destroy(plugin);
  });

  describe('Portal injection hook', function() {
    test('should work with simple graph - dependency in this same injector', function () {
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
      expect(service.portalService.foobar).toEqual('child foobar');
    });

    test('should work with simple graph - dependency in deep injector', function () {
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
        ) {}
      }
  
      const parentInjector = Injector.create([
        TestService,
        Service,
        {
          provide: 'foobar',
          useValue: 'parent foobar',
        }
      ])
      const childInjector = Injector.create([
        {
          provide: 'foobar',
          useValue: 'child foobar',
        }
      ], parentInjector)
  
      const service = childInjector.getSync(Service, Portal())
      expect(service.service).toBeInstanceOf(TestService);
      expect(service.service.foobar).toEqual('child foobar');
    });

    test('should work with complex graph - using deep option', function () {
      @Injectable({
        scope: TransientScope,
      })
      class DeepService {
        constructor(
          @Inject('foobar') readonly foobar: string,
        ) {}
      }

      @Injectable({
        scope: TransientScope,
      })
      class TestService {
        constructor(
          @Inject('foobar') readonly foobar: string,
          readonly deepService: DeepService,
        ) {}
      }
  
      @Injectable()
      class Service {
        constructor(
          readonly service: TestService,
        ) {}
      }
  
      const parentInjector = Injector.create([
        DeepService,
        TestService,
        Service,
        {
          provide: 'foobar',
          useValue: 'parent foobar',
        }
      ])
      const childInjector = Injector.create([
        {
          provide: 'foobar',
          useValue: 'child foobar',
        }
      ], parentInjector)
  
      const service = childInjector.getSync(Service, Portal({ deep: true }));
      expect(service.service).toBeInstanceOf(TestService);
      expect(service.service.foobar).toEqual('child foobar');
      expect(service.service.deepService).toBeInstanceOf(DeepService);
      expect(service.service.deepService.foobar).toEqual('child foobar');
    });
  });
});
