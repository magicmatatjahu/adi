import { Inject, Injectable, Injector, Token, Optional, ModuleToken } from '@adi/core';
import { Injector as AngularInjector, Injectable as AngularInjectable } from '@angular/core'
import { TestBed } from '@angular/core/testing';

import { provideInjector, provide } from '../../src'

describe('injection', () => {
  it('should create injector from ADI', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideInjector()
      ],
    });

    const injector = TestBed.inject(Injector);
    expect(injector).toBeInstanceOf(Injector);
  });

  it('should inject provider', async () => {
    @Injectable()
    class Service {}

    TestBed.configureTestingModule({
      providers: [
        provideInjector(),
        provide({
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
      providers: [
        provideInjector(),
        provide({
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
      providers: [
        provideInjector(),
        provide({
          providers: [Service],
        }),
        provide({
          providers: [DeepService],
        }),
      ],
    });

    const injector = TestBed.inject(Injector);
    const service = injector.getSync(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.deepService).toBeInstanceOf(DeepService);
  });

  it('should work with treeshakable providers', async () => {
    @Injectable({
      provideIn: 'any',
    })
    class DeepService {}

    @Injectable()
    class Service {
      constructor(
        public deepService: DeepService,
      ) {}
    }

    TestBed.configureTestingModule({
      providers: [
        provideInjector(),
        provide({
          providers: [Service],
        }),
      ],
    });

    const injector = TestBed.inject(Injector);
    const service = injector.getSync(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.deepService).toBeInstanceOf(DeepService);
  });

  it('should work with single hooks', async () => {
    @Injectable()
    class DeepService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(Optional()) public deepService: DeepService,
      ) {}
    }

    TestBed.configureTestingModule({
      providers: [
        provideInjector(),
        provide({
          providers: [Service],
        }),
      ],
    });

    const injector = TestBed.inject(Injector);
    const service = injector.getSync(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.deepService).toEqual(undefined);
  });

  it('should work with multiple hooks', async () => {
    @Injectable()
    class DeepService {}

    @Injectable()
    class Service {
      constructor(
        @Inject(Token(DeepService), Optional()) 
        public deepService: any,
      ) {}
    }

    TestBed.configureTestingModule({
      providers: [
        provideInjector(),
        provide({
          providers: [Service],
        }),
      ],
    });

    const injector = TestBed.inject(Injector);
    const service = injector.getSync(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.deepService).toEqual(undefined);
  });

  it('should run destroy hooks when Angular injector is destroyed', async () => {
    let called = false;

    @Injectable()
    class DeepService {
      onDestroy() {
        called = true;
      }
    }

    @Injectable()
    class Service {
      constructor(
        public deepService: DeepService,
      ) {}
    }

    TestBed.configureTestingModule({
      providers: [
        provideInjector(),
        provide({
          providers: [Service, DeepService],
        }),
      ],
    });

    const injector = TestBed.inject(Injector);
    const service = injector.getSync(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.deepService).toBeInstanceOf(DeepService);
    expect(called).toEqual(false);

    TestBed.resetTestingModule();
    
    // wait longer to handle native promise by zone
    await new Promise(resolve => {
      setTimeout(() => {
        resolve(undefined)
      }, 1)
    })
    
    expect(called).toEqual(true);
  });

  it('should be able to inject Angular injector', async () => {
    @Injectable()
    class Service {
      constructor(
        public injector: AngularInjector,
      ) {}
    }

    TestBed.configureTestingModule({
      teardown: { destroyAfterEach: false },
      providers: [
        provideInjector(),
        provide({
          providers: [Service],
        }),
      ],
    });

    const injector = TestBed.inject(Injector);
    const service = injector.getSync(Service);
    expect(service).toBeInstanceOf(Service);
    expect(typeof service.injector.get === 'function').toEqual(true);
  });

  it('should be able to use Angular providers in ADI context', async () => {
    @AngularInjectable()
    class AngularService {}

    @Injectable()
    class Service {
      public angularService: AngularService;

      constructor(
        public injector: AngularInjector,
      ) {
        this.angularService = injector.get(AngularService);
      }
    }

    TestBed.configureTestingModule({
      teardown: { destroyAfterEach: false },
      providers: [
        AngularService,
        provideInjector(),
        provide({
          providers: [Service],
        }),
      ],
    });

    const injector = TestBed.inject(Injector);
    const service = injector.getSync(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.angularService).toBeInstanceOf(AngularService);
  });

  it('should be able to create async injector', async () => {
    const childModule = ModuleToken.create()

    const rootModule = ModuleToken.create({
      imports: [
        Promise.resolve(childModule)
      ]
    })

    TestBed.configureTestingModule({
      providers: [
        provideInjector(rootModule),
      ],
    });

    let injector = TestBed.inject(Injector);
    // is promise
    expect(injector).not.toBeInstanceOf(Injector);

    // wait longer to handle native promise by zone
    await new Promise(process.nextTick)

    injector = TestBed.inject(Injector);
    expect(injector).toBeInstanceOf(Injector);
  });
});
