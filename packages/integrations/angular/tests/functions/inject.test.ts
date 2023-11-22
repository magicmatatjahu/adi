import { Injectable, Injector, Optional, Token, TransientScope, wait } from '@adi/core';
import { Injectable as AngularInjectable, Component, inject as angularInject } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { provideInjector, provide, inject } from '../../src'
import { wait as waitTest } from '../helpers';

describe('inject() function', () => {
  it('should work', async () => {
    @AngularInjectable()
    class Service {
      public injector = inject(Injector)
    }

    TestBed.configureTestingModule({
      providers: [
        provideInjector(),
        Service,
      ],
    });

    const service = TestBed.inject(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.injector).toBeInstanceOf(Injector);
  });

  it('should work with sync injection', async () => {
    @AngularInjectable()
    class Service {
      public value = inject('token')
    }

    TestBed.configureTestingModule({
      providers: [
        Service,
        provideInjector(),
        provide({
          providers: [
            {
              provide: 'token',
              useFactory() {
                return 'sync value'
              }
            }
          ]
        }),
      ],
    });

    const service = TestBed.inject(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.value).toEqual('sync value');
  });

  it('should work with async injection', async () => {
    @AngularInjectable()
    class Service {
      public value = inject('token')
    }

    TestBed.configureTestingModule({
      providers: [
        Service,
        provideInjector(),
        provide({
          providers: [
            {
              provide: 'token',
              async useFactory() {
                return 'async value'
              }
            }
          ]
        }),
      ],
    });

    const service = TestBed.inject(Service);
    expect(service).toBeInstanceOf(Service);
    expect(await service.value).toEqual('async value');
  });

  it('should work with treeshakable providers', async () => {
    @Injectable({
      provideIn: 'any',
    })
    class DeepService {}

    @AngularInjectable()
    class Service {
      public deepService = inject(DeepService)
    }

    TestBed.configureTestingModule({
      providers: [
        provideInjector(),
        Service,
      ],
    });

    const service = TestBed.inject(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.deepService).toBeInstanceOf(DeepService);
  });

  it('should work with hooks', async () => {
    class DeepService {}

    @AngularInjectable()
    class Service {
      public deepService = inject(DeepService, Optional())
    }

    TestBed.configureTestingModule({
      providers: [
        provideInjector(),
        Service,
      ],
    });

    const service = TestBed.inject(Service);
    expect(service).toBeInstanceOf(Service);
    expect(service.deepService).toEqual(undefined);
  });

  it('should work with multiple hooks', async () => {
    class DeepService {}

    @AngularInjectable()
    class Service {
      public deepService = inject(Token(DeepService), Optional())
    }

    TestBed.configureTestingModule({
      providers: [
        provideInjector(),
        Service,
      ],
    });

    const service = TestBed.inject(Service);
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

    @AngularInjectable()
    class Service {
      public deepService = inject(DeepService)
    }

    TestBed.configureTestingModule({
      providers: [
        provideInjector(),
        provide({
          providers: [DeepService],
        }),
        Service,
      ],
    });

    const service = TestBed.inject(Service);
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

  it('should work inside component', async () => {
    @Injectable()
    class Service {}

    @Component({
      standalone: true,
    })
    class SomeComponent {
      public service = inject(Service)
    }

    TestBed.configureTestingModule({
      providers: [
        provideInjector(),
        provide({
          providers: [Service],
        }),
      ],
    });

    const fixture = TestBed.createComponent(SomeComponent);
    expect(fixture.componentInstance.service).toBeInstanceOf(Service);
  });

  it('should work inside component with deep dependencies', async () => {
    @Injectable()
    class DeepService {}

    @Injectable()
    class Service {
      constructor(
        public deepService: DeepService,
      ) {}
    }

    @Component({
      standalone: true,
    })
    class SomeComponent {
      public service = inject(Service)
    }

    TestBed.configureTestingModule({
      providers: [
        provideInjector(),
        provide({
          providers: [Service, DeepService],
        }),
      ],
    });

    const fixture = TestBed.createComponent(SomeComponent);
    expect(fixture.componentInstance.service).toBeInstanceOf(Service);
    expect(fixture.componentInstance.service.deepService).toBeInstanceOf(DeepService);
  });

  it('should not destroy when component is destroyed - providers with not dynamic scope', async () => {
    let called = 0;

    @Injectable()
    class DeepService {
      onDestroy() {
        called++;
      }
    }

    @Injectable()
    class Service {
      constructor(
        public deepService: DeepService,
      ) {}

      onDestroy() {
        called++;
      }
    }

    @Component({
      standalone: true,
    })
    class SomeComponent {
      public service = inject(Service)
    }

    TestBed.configureTestingModule({
      providers: [
        provideInjector(),
        provide({
          providers: [Service, DeepService],
        }),
      ],
    });

    const fixture = TestBed.createComponent(SomeComponent);
    expect(fixture.componentInstance.service).toBeInstanceOf(Service);
    expect(fixture.componentInstance.service.deepService).toBeInstanceOf(DeepService);
    expect(called).toEqual(0);

    fixture.destroy();
    
    await Promise.resolve(process.nextTick)
    await Promise.resolve(process.nextTick)

    expect(called).toEqual(0);
  });

  it('should destroy when component is destroyed - providers with dynamic scope', async () => {
    let called = 0;

    @Injectable({
      scope: TransientScope,
    })
    class DeepService {
      onDestroy() {
        called++;
      }
    }

    @Injectable({
      scope: TransientScope,
    })
    class Service {
      constructor(
        public deepService: DeepService,
      ) {}

      onDestroy() {
        called++;
      }
    }

    @Component({
      standalone: true,
    })
    class SomeComponent {
      public service = inject(Service)
    }

    TestBed.configureTestingModule({
      providers: [
        provideInjector(),
        provide({
          providers: [Service, DeepService],
        }),
      ],
    });

    const fixture = TestBed.createComponent(SomeComponent);
    expect(fixture.componentInstance.service).toBeInstanceOf(Service);
    expect(fixture.componentInstance.service.deepService).toBeInstanceOf(DeepService);
    expect(called).toEqual(0);

    fixture.destroy();
    
    await waitTest();
    await waitTest();

    expect(called).toEqual(2);
  });

  it('should destroy when component is destroyed - one provider singleton and with dynamic scope', async () => {
    let called = 0;

    @Injectable()
    class DeepService {
      onDestroy() {
        called++;
      }
    }

    @Injectable({
      scope: TransientScope,
    })
    class Service {
      constructor(
        public deepService: DeepService,
      ) {}

      onDestroy() {
        called++;
      }
    }

    @Component({
      standalone: true,
    })
    class SomeComponent {
      public service = inject(Service)
    }

    TestBed.configureTestingModule({
      providers: [
        provideInjector(),
        provide({
          providers: [Service, DeepService],
        }),
      ],
    });

    const fixture = TestBed.createComponent(SomeComponent);
    expect(fixture.componentInstance.service).toBeInstanceOf(Service);
    expect(fixture.componentInstance.service.deepService).toBeInstanceOf(DeepService);
    expect(called).toEqual(0);

    fixture.destroy();
    
    await waitTest();
    await waitTest();

    expect(called).toEqual(1);
  });

  it('should not create new injector in component when provideInjector is not provided', async () => {
    @Component({
      standalone: true,
    })
    class SomeComponent {
      public injector = angularInject(Injector)
    }

    TestBed.configureTestingModule({
      providers: [
        provideInjector(),
      ],
    });

    const fixture = TestBed.createComponent(SomeComponent);

    const injector = TestBed.inject(Injector);
    const componentInjector = fixture.componentInstance.injector;

    expect(injector).toBeInstanceOf(Injector);
    expect(componentInjector).toBeInstanceOf(Injector);
    expect(injector === componentInjector).toEqual(true);
  });

  it('should create new injector in component when provideInjector is provided', async () => {
    @Component({
      standalone: true,
      providers: [
        provideInjector(),
      ]
    })
    class SomeComponent {
      public injector = angularInject(Injector)
    }

    TestBed.configureTestingModule({
      providers: [
        provideInjector(),
      ],
    });

    const fixture = TestBed.createComponent(SomeComponent);

    const injector = TestBed.inject(Injector);
    const componentInjector = fixture.componentInstance.injector;

    expect(injector).toBeInstanceOf(Injector);
    expect(componentInjector).toBeInstanceOf(Injector);
    expect(injector === componentInjector).toEqual(false);
  });
});
