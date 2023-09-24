import { Inject, Injectable, Injector } from '@adi/core';
import { Injectable as AngularInjectable } from '@angular/core'
import { TestBed } from '@angular/core/testing';

import { provideInjector, provide, AngularFallback } from '../../src'

describe('AngularFallback injection hook', () => {
  it('should inject provider from Angular when provider does not exist in ADI injector', async () => {
    @AngularInjectable()
    class AngularService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(AngularFallback(AngularService)) 
        public service: String
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
    expect(service.service).toBeInstanceOf(AngularService);
  });

  it('should inject provider from ADI when provider exist in ADI injector', async () => {
    @AngularInjectable()
    class AngularService {}

    @Injectable()
    class ADIService { }

    @Injectable()
    class Service {
      constructor(
        @Inject(AngularFallback(AngularService)) 
        public service: ADIService
      ) {}
    }

    TestBed.configureTestingModule({
      teardown: { destroyAfterEach: false },
      providers: [
        AngularService,
        provideInjector(),
        provide({
          providers: [Service, ADIService]
        })
      ],
    });

    const injector = TestBed.inject(Injector);
    const service = injector.getSync(Service)
    expect(service).toBeInstanceOf(Service);
    expect(service.service).toBeInstanceOf(ADIService);
  });

  it('should use flags when provider does not exist in Angular Injector', async () => {
    @AngularInjectable()
    class AngularService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(AngularFallback(AngularService, { optional: true })) 
        public service: String
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
    expect(service.service).toEqual(null);
  });
});
