import { Injectable, Injector } from '@adi/core';
import { TestBed } from '@angular/core/testing';

import { ADIModule } from '../../src'

describe('ADIModule', () => {
  it('should create injector from ADI', async () => {
    TestBed.configureTestingModule({
      imports: [
        ADIModule.provideInjector(),
      ]
    });

    const injector = TestBed.inject(Injector);
    expect(injector).toBeInstanceOf(Injector);
  });

  it('should inject provider', async () => {
    @Injectable()
    class Service {}

    TestBed.configureTestingModule({
      imports: [
        ADIModule.provideInjector(),
        ADIModule.provide({
          providers: [Service],
        }),
      ],
    });

    const injector = TestBed.inject(Injector);
    const service = injector.getSync(Service);
    expect(service).toBeInstanceOf(Service);
  });

  it('should injection be performed inside ADI', async () => {
    @Injectable()
    class DeepService {}

    @Injectable()
    class Service {
      constructor(
        public deepService: DeepService,
      ) {}
    }

    TestBed.configureTestingModule({
      imports: [
        ADIModule.provideInjector(),
        ADIModule.provide({
          providers: [Service, DeepService],
        }),
      ],
    });

    const injector = TestBed.inject(Injector);
    const service = injector.getSync(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.deepService).toBeInstanceOf(DeepService);
  });

  it('should be able to pass more than one provide', async () => {
    @Injectable()
    class DeepService {}

    @Injectable()
    class Service {
      constructor(
        public deepService: DeepService,
      ) {}
    }

    TestBed.configureTestingModule({
      imports: [
        ADIModule.provideInjector(),
        ADIModule.provide({
          providers: [Service],
        }),
        ADIModule.provide({
          providers: [DeepService],
        }),
      ],
    });

    const injector = TestBed.inject(Injector);
    const service = injector.getSync(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.deepService).toBeInstanceOf(DeepService);
  });
});
