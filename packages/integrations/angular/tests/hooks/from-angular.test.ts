import { Inject, Injectable, Injector } from '@adi/core';
import { Injectable as AngularInjectable } from '@angular/core'
import { TestBed } from '@angular/core/testing';

import { provideInjector, provide, FromAngular } from '../../src'

describe('FromAngular injection hook', () => {
  it('should inject provider from Angular', async () => {
    @AngularInjectable()
    class AngularService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(FromAngular()) 
        public angularService: AngularService
      ) {}
    }

    TestBed.configureTestingModule({
      teardown: { destroyAfterEach: false },
      providers: [
        AngularService,
        provideInjector(),
        provide({
          providers: [Service]
        })
      ],
    });

    const injector = TestBed.inject(Injector);
    const service = injector.getSync(Service)
    expect(service).toBeInstanceOf(Service);
    expect(service.angularService).toBeInstanceOf(AngularService);
  });

  it('should work together with another providers', async () => {
    @AngularInjectable()
    class AngularService {}

    @Injectable()
    class AnotherService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(FromAngular()) 
        public angularService: AngularService,
        public anotherService: AnotherService,
      ) {}
    }

    TestBed.configureTestingModule({
      teardown: { destroyAfterEach: false },
      providers: [
        AngularService,
        provideInjector(),
        provide({
          providers: [Service, AnotherService]
        })
      ],
    });

    const injector = TestBed.inject(Injector);
    const service = injector.getSync(Service)
    expect(service).toBeInstanceOf(Service);
    expect(service.angularService).toBeInstanceOf(AngularService);
    expect(service.anotherService).toBeInstanceOf(AnotherService);
  });

  it('should inject provider from Angular with token passed as option to hook', async () => {
    @AngularInjectable()
    class AngularService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(FromAngular(AngularService)) 
        public angularService: any
      ) {}
    }

    TestBed.configureTestingModule({
      teardown: { destroyAfterEach: false },
      providers: [
        AngularService,
        provideInjector(),
        provide({
          providers: [Service]
        })
      ],
    });

    const injector = TestBed.inject(Injector);
    const service = injector.getSync(Service)
    expect(service).toBeInstanceOf(Service);
    expect(service.angularService).toBeInstanceOf(AngularService);
  });

  it('should inject provider from Angular with flags as first argument in hook', async () => {
    @AngularInjectable()
    class AngularService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(FromAngular({ optional: true })) 
        public angularService: AngularService
      ) {}
    }

    TestBed.configureTestingModule({
      teardown: { destroyAfterEach: false },
      providers: [
        provideInjector(),
        provide({
          providers: [Service]
        })
      ],
    });

    const injector = TestBed.inject(Injector);
    const service = injector.getSync(Service)
    expect(service).toBeInstanceOf(Service);
    expect(service.angularService).toEqual(null);
  });

  it('should inject provider from Angular with flags as second argument in hook', async () => {
    @AngularInjectable()
    class AngularService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(FromAngular(AngularService, { optional: true })) 
        public angularService: any
      ) {}
    }

    TestBed.configureTestingModule({
      teardown: { destroyAfterEach: false },
      providers: [
        provideInjector(),
        provide({
          providers: [Service]
        })
      ],
    });

    const injector = TestBed.inject(Injector);
    const service = injector.getSync(Service)
    expect(service).toBeInstanceOf(Service);
    expect(service.angularService).toEqual(null);
  });
});
